class FundingFlow:

    def __init__(self):
        self.db = Storage('funding_flow')
        self.parameters = self.db['parameters']
        self.config = self.db['config']
        self.contributions = Storage('contributions')
        self.items = Storage('items')
        self.allocations = Storage('allocations')

    def set_community_and_fund(self, community_server, community_agent, community_id, fund_account_name):
        if 'community_id' not in self.parameters:
            self.parameters['community_server'] = community_server
            self.parameters['community_agent'] = community_agent
            self.parameters['community_id'] = community_id
            self.parameters['fund_account_name'] = fund_account_name

    def get_community(self):
        return {
            'server': self.parameters['community_server'],
            'agent': self.parameters['community_agent'],
            'id': self.parameters['community_id'],
        }

    def get_fund_account_name(self):
        return self.parameters['fund_account_name']

    # Fund configuration
    def set_config(self, config):
        self.config['data'] = config

    def get_config(self):
        if 'data' not in self.config:
            return {}
        return self.config['data'].get_dict()

    # Contributions
    def add_contribution(self, contribution):
        self.contributions.append(contribution)

    def get_contributions(self):
        return [self.contributions[key].get_dict() for key in self.contributions]

    # Budget items
    def add_item(self, item):
        self.items.append(item)

    def get_items(self):
        return [self.items[key].get_dict() for key in self.items]

    # Allocations — one record per participant
    def set_my_allocation(self, allocation):
        self.allocations[master()] = {'participantId': master(), 'allocation': allocation}

    def get_all_allocations(self):
        return [self.allocations[key].get_dict() for key in self.allocations]
