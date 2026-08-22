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

    def get_profile(self):
        if not self.profile.exists():
            return None
        return self.profile.get_dict()
