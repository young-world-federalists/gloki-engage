class DigitalAgent:

    def __init__(self):
        self.profile = Storage('profile')['data']

    def set_profile(self, display_name, photo, country, languages):
        self.profile.update({
            'displayName': display_name,
            'photo': photo,
            'country': country,
            'languages': languages,
            'updatedAt': timestamp(),
        })

    # Separate from set_profile on purpose: contracts are immutable, so profiles
    # deployed before this method reject the call and nothing else breaks
    # (docs/FOR_OURI_seam.md, S46 note). get_profile returns it as 'accountKind'.
    def set_account_kind(self, kind):
        if kind not in ['person', 'organisation', 'contributor']:
            return {'error': 'unknown account kind'}
        self.profile.update({
            'accountKind': kind,
            'updatedAt': timestamp(),
        })

    def get_profile(self):
        if not self.profile.exists():
            return None
        return self.profile.get_dict()
