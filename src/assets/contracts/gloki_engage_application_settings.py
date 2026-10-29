class GlokiEngageApplicationSettings:
    # Application-wide settings, deployed once on the central application
    # account (VITE_APPLICATION_AGENT on VITE_APPLICATION_SERVER_URL). Today it
    # records one thing: where the verification contract lives. That contract
    # is deployed by the first person to get verified, on their own agent; any
    # agent that holds it can serve it, so this keeps a list of hosts for the
    # one contract id. Later, more stewards will join this contract and add
    # themselves as hosts, so no single account is the only way in.
    #
    # Every refusal returns {'error': ...} and writes nothing; success returns None.

    def __init__(self):
        self.verification = Storage('settings')['verification']
        self.hosts = Storage('verification_hosts')  # key = agent

    def get_verification(self):
        # {contract, hosts: [{server, agent}]}; contract '' = verification not started.
        return {
            'contract': self.verification['contract'] or '',
            'hosts': [self.hosts[k].get_dict() for k in self.hosts],
        }

    def register_verification(self, server, agent, contract):
        if not server or not agent or not contract:
            return {'error': 'server, agent and contract are required'}
        current = self.verification['contract'] or ''
        if current and current != contract:
            return {'error': 'Verification has already started'}
        if not current:
            self.verification.update({'contract': contract, 'since': timestamp()})
        self.hosts[agent] = {'server': server, 'agent': agent}
        return None
