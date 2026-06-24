class Community:

    def __init__(self):
        self.db = Storage('community')
        self.members = self.db['members']
        self.nominates = self.db['nominates']
        self.approvals = self.db['approvals']
        self.properties = self.db['properties']
        self.sub_contracts = self.db['sub_contracts']
        self.collaborations = Storage('collaborations')
        self.issues = Storage('issues')
        self.accounts = Storage('accounts')
        self.allocations = Storage('allocations')
        if 'centralAccount' not in self.accounts:
            self.accounts['centralAccount'] = {'balanceOf':0, 'creationTime': timestamp(), 'elapsedDays': 0, 'type': 'central'}


    def add_issue(self, issue):
        self.issues.append(issue)

    def get_issues(self):
        return [self.issues[key].get_dict() for key in self.issues]

    def add_collaboration(self, collaboration):
        self.collaborations.append(collaboration)

    def get_collaborations(self):
        return [self.collaborations[key].get_dict() for key in self.collaborations]

    def set_instructions(self, instructions):
        self.properties['instructions'] = instructions
    
    def set_sub_contract(self, name, invite):
        self.sub_contracts[name] = invite

    def get_sub_contract(self, name):
        return self.sub_contracts[name]

    def get_all_people(self):
        return {'tasks': self.get_tasks(),
                'members': self.get_members(),
                'nominates': self.get_nominates()}
    
    def get_tasks(self):
        reply = {}
        requester = master()
        if requester in self.nominates:
            for task in self.nominates[requester]:
                reply[task] = requester in self.approvals and task in self.approvals[requester]
        else:
            for task in self.nominates:
                if requester in self.nominates[task]:
                    reply[task] = requester in self.approvals and task in self.approvals[requester]
        return reply
    
    def get_members(self):
        return {key: self.members[key] for key in self.members}
        # return partners()

    def is_member(self, agent):
        return agent in self.members

    def get_nominates(self):
        return [key for key in self.nominates]
    
    def set_property(self, key, value):
        self.properties[key] = value
    
    def get_properties(self):
        return self.properties.get_dict()

    def become_member(self, key, value):
        self.members[key] = value
        self.accounts[key] = {'balanceOf':1000, 'creationTime': timestamp(), 'elapsedDays': 0}

    def request_join(self):
        requester = master()
        if requester in self.members or requester in self.nominates:
            return False
        if len(self.members) == 0:
            self.become_member(requester, [])
        elif len(self.members) < 5:
            if len(self.nominates) == 0:
                self.nominates[requester] = [member for member in self.members]
            else:
                return False
        else:
            edges = [(key, value) for key in self.members for value in self.members[key]]
            for nominate in self.nominates:
                others = self.nominates[nominate]
                edges.remove((others[0], others[1]))
                edges.remove((others[1], others[0]))
                edges.remove((others[2], others[3]))
                edges.remove((others[3], others[2]))
            if len(edges) < 4:
                return False
            [r, s] = random(timestamp(), None, len(edges))
            first = edges[r]
            toRemove = {(first[0], value) for value in self.members[first[0]]} |\
                       {(value, first[0]) for value in self.members[first[0]]} |\
                       {(first[1], value) for value in self.members[first[1]]} |\
                       {(value, first[1]) for value in self.members[first[1]]}
            edges = [value for value in edges if value not in toRemove]
            [r, s] = random(None, s, len(edges))
            second = edges[r]
            self.nominates[requester] = [first[0], first[1], second[0], second[1]]
        return True

    def approve(self, approved):
        approver = master()
        (nominate, member) = (approved, approver) if approved in self.nominates else (approver, approved) if approver in self.nominates else (None, None)
        if nominate and member in self.nominates[nominate]:
            self.approvals[approver] = (self.approvals[approver] or []) + [approved]
            all_approved = True
            if nominate in self.approvals:
                for member in self.nominates[nominate]:
                    if not member in self.approvals[nominate] or not member in self.approvals or not nominate in self.approvals[member]:
                        all_approved = False
            else:
                all_approved = False
            if all_approved:
                order = self.nominates[nominate]
                click = len(self.members) < 5
                for i in range(len(order)):
                    previous = self.members[order[i]]
                    if not click:
                        previous.remove(order[i+1-2*(i % 2)])
                    previous.append(nominate)
                    self.members[order[i]] = previous
                self.become_member(nominate, order)
                del self.nominates[nominate]

    def disapprove(self, disapproved):
        approver = master()
        nominate = disapproved if disapproved in self.nominates else approver if approver in self.nominates else None
        if nominate:
            members = self.nominates[nominate]
            del self.nominates[nominate]
            if nominate in self.approvals:
                del self.approvals[nominate]
            for member in members:
                if member in self.approvals:
                    approvals = self.approvals[member]
                    if nominate in approvals:
                        approvals.remove(nominate)
                        if approvals:
                            self.approvals[member] = approvals
                        else:
                            del self.approvals[member]

    def create_fund_account(self, name, owner):
        if name in self.accounts:
            return False
        self.accounts[name] = {
            'balanceOf': 0,
            'creationTime': timestamp(),
            'elapsedDays': 0,
            'type': 'fund',
            'owner': owner
        }
        return True

    def check_balance(self, account, update = False):
        if account not in self.accounts:
            return 0
        account_data = self.accounts[account].get_dict()
        # to count days divide by 86400. for testing, divide by 60
        time_passed = elapsed_time(account_data['creationTime'], timestamp()) / 600
        days_passed = round(time_passed - 0.5) - account_data['elapsedDays']
        if days_passed <= 0:
            return account_data['balanceOf']

        burnFactor = (100 - parameters('burn')) / 100
        account_type = account_data.get('type')
        if account_type == 'fund':
            mint = 0
        elif account_type == 'central':
            mint = parameters('commons_mint')
        else:
            mint = parameters('mint')
        for i in range(days_passed):
            account_data['balanceOf'] *= burnFactor
            account_data['balanceOf'] += mint
        account_data['elapsedDays'] += days_passed
        if update:
            self.accounts[account] = account_data
        return account_data['balanceOf']

    def transfer(self, to, value):
        sender = master()
        if sender not in self.accounts or to not in self.accounts:
            return False
        sender_data = self.accounts[sender].get_dict()
        if sender_data.get('type') == 'fund':
            return False
        self.check_balance(sender, True)
        self.check_balance(to, True)

        sender_account = self.accounts[sender].get_dict()
        to_account = self.accounts[to].get_dict()
        if sender_account['balanceOf'] >= value:
            sender_account['balanceOf'] -= value
            to_account['balanceOf'] += value
            self.accounts[sender] = sender_account
            self.accounts[to] = to_account
            return True
        return False

    def fund_transfer(self, fund_name, to, value):
        caller = master()
        if fund_name not in self.accounts or to not in self.accounts:
            return False
        fund_data = self.accounts[fund_name].get_dict()
        if fund_data.get('type') != 'fund' or fund_data.get('owner') != caller:
            return False
        self.check_balance(fund_name, True)
        self.check_balance(to, True)

        fund_account = self.accounts[fund_name].get_dict()
        to_account = self.accounts[to].get_dict()
        if fund_account['balanceOf'] >= value:
            fund_account['balanceOf'] -= value
            to_account['balanceOf'] += value
            self.accounts[fund_name] = fund_account
            self.accounts[to] = to_account
            return True
        return False

    def get_balance(self):
        account = master()
        return self.check_balance(account)

    def get_fund_balance(self, fund_name):
        return self.check_balance(fund_name)

    def before_parameters_update(self):
        for account in self.accounts:
            self.check_balance(account, True)

    def get_accounts(self):
        return [account for account in self.accounts]

    def get_account_details(self):
        result = {}
        for account in self.accounts:
            data = self.accounts[account].get_dict()
            result[account] = {
                'type': data.get('type', 'personal'),
                'balance': self.check_balance(account),
            }
        return result

    def set_allocation(self, allocation):
        member = master()
        if member not in self.members:
            return False
        total = 0
        for account in allocation:
            total = total + allocation[account]
        if total > 1000:
            return False
        self.allocations[member] = allocation
        return True

    def get_allocations(self):
        result = {}
        for member in self.allocations:
            result[member] = self.allocations[member].get_dict()
        return result

    def get_distribution_status(self):
        payment_count = self.properties['payment_count'] or 0
        central_data = self.accounts['centralAccount'].get_dict()
        time_passed = elapsed_time(central_data['creationTime'], timestamp()) / 600
        days_since_creation = round(time_passed - 0.5) if time_passed >= 0.5 else 0
        return {
            'payment_count': payment_count,
            'days_since_creation': days_since_creation,
            'can_distribute': payment_count < days_since_creation
        }

    def distribute(self):
        caller = master()
        if caller not in self.members:
            return False

        payment_count = self.properties['payment_count'] or 0
        central_data = self.accounts['centralAccount'].get_dict()
        time_passed = elapsed_time(central_data['creationTime'], timestamp()) / 600
        days_since_creation = round(time_passed - 0.5) if time_passed >= 0.5 else 0
        if payment_count >= days_since_creation:
            return False

        totals = {}
        grand_total = 0
        for member in self.allocations:
            alloc = self.allocations[member].get_dict()
            for account in alloc:
                points = alloc[account]
                if account in totals:
                    totals[account] = totals[account] + points
                else:
                    totals[account] = points
                grand_total = grand_total + points

        if grand_total == 0:
            return False

        self.check_balance('centralAccount', True)
        total_balance = self.accounts['centralAccount'].get_dict()['balanceOf']

        if total_balance <= 0:
            return False

        distributed = 0
        for account in self.accounts:
            if account == 'centralAccount':
                continue
            account_data = self.accounts[account].get_dict()
            if account_data.get('type') != 'fund':
                continue
            if account not in totals:
                continue
            amount = total_balance * totals[account] / grand_total
            if amount > 0:
                self.check_balance(account, True)
                fund_data = self.accounts[account].get_dict()
                fund_data['balanceOf'] = fund_data['balanceOf'] + amount
                self.accounts[account] = fund_data
                distributed = distributed + amount

        central_data = self.accounts['centralAccount'].get_dict()
        central_data['balanceOf'] = central_data['balanceOf'] - distributed
        self.accounts['centralAccount'] = central_data

        self.properties['payment_count'] = payment_count + 1
        return True