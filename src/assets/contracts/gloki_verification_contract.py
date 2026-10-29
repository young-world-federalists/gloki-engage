class GlokiVerification:
    # The one app-wide verification contract. Deployed once, under the
    # application agent (VITE_APPLICATION_AGENT on VITE_APPLICATION_SERVER_URL),
    # by the first person to get verified, who becomes its steward. Users do
    # not join it: every call reaches it through the application agent, so
    # master() is always that agent and each method takes the acting person's
    # public key as an argument instead.
    #
    # The verified list is the single source of truth for "verified" across
    # the app. Three phases, by how many people are verified (V):
    #   V == 0  founder     initialize() verifies the steward, no vouches.
    #   V 1..3  sequential  one candidate at a time; every verified person
    #                       must vouch before register() accepts them.
    #   V >= 4  open        any requester; four vouches from verified people.
    #
    # Every refusal returns {'error': ...} and writes nothing; success returns None.

    def __init__(self):
        self.meta = Storage('verification')['meta']
        self.slot = Storage('verification')['candidate']
        self.verified = Storage('verified')       # key = public key
        self.requests = Storage('vouch_requests') # key = requester + ':' + approver
        self.vouches = Storage('vouches')         # key = voucher + ':' + requester

    # ─── Helpers ────────────────────────────────────────────────────────────

    def _open_threshold(self):
        return 4

    def _is_sequential(self):
        return len(self.verified) < self._open_threshold()

    def _candidate(self):
        return self.slot['key'] or ''

    def _drop_requester(self, requester):
        # Removes every request from, and every vouch for, `requester`.
        request_keys = [str(k) for k in self.requests if self.requests[k]['requester'] == requester]
        for key in request_keys:
            del self.requests[key]
        vouch_keys = [str(k) for k in self.vouches if self.vouches[k]['requester'] == requester]
        for key in vouch_keys:
            del self.vouches[key]

    # ─── Founder ────────────────────────────────────────────────────────────

    def initialize(self, steward, address, profile):
        if self.meta.exists():
            return {'error': 'Verification has already started'}
        if not steward:
            return {'error': 'A steward key is required'}
        now = timestamp()
        self.meta.update({'steward': steward, 'createdAt': now})
        self.slot.update({'key': '', 'since': ''})
        self.verified[steward] = {
            'key': steward, 'at': now, 'method': 'founder', 'vouchers': [],
            'address': address, 'profile': profile,
        }
        return None

    # ─── Reads ──────────────────────────────────────────────────────────────

    def get_status(self):
        return {
            'steward': self.meta['steward'] or '',
            'verified': [self.verified[k].get_dict() for k in self.verified],
            'candidate': self._candidate(),
            'candidateSince': self.slot['since'] or '',
            'requests': [self.requests[k].get_dict() for k in self.requests],
            'vouches': [self.vouches[k].get_dict() for k in self.vouches],
        }

    # ─── Requests and vouches ───────────────────────────────────────────────

    def request_vouch(self, requester, approver, address, profile):
        if not self.meta.exists():
            return {'error': 'Verification has not started'}
        if not requester or not approver or requester == approver:
            return {'error': 'Invalid request'}
        if requester in self.verified:
            return {'error': 'You are already verified'}
        if approver not in self.verified:
            return {'error': 'Only verified people can vouch'}
        if self._is_sequential():
            current = self._candidate()
            if current and current != requester:
                return {'error': 'Someone else is being verified right now'}
            if not current:
                self.slot.update({'key': requester, 'since': timestamp()})
        key = requester + ':' + approver
        if key in self.requests and self.requests[key]['status'] == 'approved':
            return None
        self.requests[key] = {
            'requester': requester, 'approver': approver,
            'address': address, 'profile': profile,
            'at': timestamp(), 'status': 'pending',
        }
        return None

    def vouch(self, voucher, requester):
        if voucher not in self.verified:
            return {'error': 'Only verified people can vouch'}
        if requester in self.verified:
            return {'error': 'Already verified'}
        key = requester + ':' + voucher
        if key not in self.requests:
            return {'error': 'No request from this person'}
        self.requests[key]['status'] = 'approved'
        self.vouches[voucher + ':' + requester] = {
            'voucher': voucher, 'requester': requester, 'at': timestamp(),
        }
        return None

    def decline_vouch(self, approver, requester):
        key = requester + ':' + approver
        if key not in self.requests:
            return {'error': 'No request from this person'}
        if self.requests[key]['status'] != 'pending':
            return {'error': 'This request is already settled'}
        self.requests[key]['status'] = 'declined'
        return None

    # ─── Registration: the only way onto the verified list after the founder ─

    def register(self, newcomer, vouchers, address, profile):
        if not self.meta.exists():
            return {'error': 'Verification has not started'}
        if not newcomer:
            return {'error': 'A key is required'}
        if newcomer in self.verified:
            return {'error': 'You are already verified'}
        seen = {}
        for voucher in vouchers:
            if voucher in seen:
                return {'error': 'Each voucher may be listed once'}
            seen[voucher] = True
            if voucher not in self.verified:
                return {'error': 'Every voucher must be verified'}
            if (voucher + ':' + newcomer) not in self.vouches:
                return {'error': 'A listed voucher has not vouched for you'}
        sequential = self._is_sequential()
        if sequential:
            if self._candidate() != newcomer:
                return {'error': 'Someone else is being verified right now'}
            for key in self.verified:
                if str(key) not in seen:
                    return {'error': 'Every verified person must vouch'}
        elif len(seen) < self._open_threshold():
            return {'error': 'Four vouches are needed'}
        self.verified[newcomer] = {
            'key': newcomer, 'at': timestamp(),
            'method': 'sequential' if sequential else 'vouches',
            'vouchers': vouchers, 'address': address, 'profile': profile,
        }
        if sequential:
            self.slot.update({'key': '', 'since': ''})
        self._drop_requester(newcomer)
        return None

    # ─── Steward ────────────────────────────────────────────────────────────

    def reset_candidate(self, steward):
        if not steward or steward != self.meta['steward']:
            return {'error': 'Only the steward can reset the candidate'}
        current = self._candidate()
        self.slot.update({'key': '', 'since': ''})
        if current:
            self._drop_requester(current)
        return None
