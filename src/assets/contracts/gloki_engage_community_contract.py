class GlokiEngageCommunity:

    def __init__(self):
        self.details = Storage('community')['details']
        self.initiatives = Storage('initiatives')

    def get_details(self):
        return self.details.get_dict()

    def set_details(self, name, description):
        # createdAt/createdBy are set once, on the first call, and preserved
        # across later edits to name/description.
        if not self.details.exists():
            self.details.update({'createdAt': timestamp(), 'createdBy': master()})
        self.details.update({'name': name, 'description': description})

    def add_initiative(self, initiative):
        return self.initiatives.append(initiative)

    def get_initiatives(self):
        return [self.initiatives[key].get_dict() for key in self.initiatives]
