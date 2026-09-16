# Replacement for the conviction-staking block in
# server-side/src/assets/contracts/gloki_engage_initiative_contract.py.
# Re-verified against origin/server-side @ a81218f on 2026-09-16.
#
# Replace the complete block from `_duration_multiplier` through
# `get_conviction_by_country` inside class GlokiEngageInitiative with the
# methods below. No new imports or Storage entries are required.

def _duration_multiplier(self, duration):
    multipliers = {'1w': 1, '1m': 2, '3m': 4, '6m': 7, '1y': 12}
    return multipliers[duration] if duration in multipliers else None


def _conviction_strength(self, stake):
    cap = self._duration_multiplier(stake['duration']) or 1
    started_at = stake['timestamp']
    if not started_at:
        return 1
    try:
        elapsed_seconds = elapsed_time(started_at, timestamp())
    except:
        return 1
    if elapsed_seconds <= 0:
        return 1
    strength = 1 + elapsed_seconds / (30 * 24 * 60 * 60)
    return cap if strength > cap else strength


def stake(self, amount, duration, country):
    if amount != 1:
        return {'error': 'Stake amount must be exactly 1'}
    if self._duration_multiplier(duration) is None:
        return {'error': 'Invalid duration'}
    caller = master()
    if caller in self.stakes:
        return {'error': 'Already backing — use update_stake'}
    self.stakes[caller] = {
        'amount': amount,
        'duration': duration,
        'timestamp': timestamp(),
        'country': country or 'OTHER',
        'voter': caller,
    }
    return None


def update_stake(self, duration, country):
    now_mult = self._duration_multiplier(duration)
    if now_mult is None:
        return {'error': 'Invalid duration'}
    caller = master()
    if caller not in self.stakes:
        return {'error': 'No commitment to change'}
    existing = self.stakes[caller].get_dict()
    was_mult = self._duration_multiplier(existing['duration']) or 1
    self.stakes[caller].update({
        'duration': duration,
        'country': existing['country'] if not country else country,
        'timestamp': timestamp() if now_mult < was_mult else existing['timestamp'],
    })
    return None


def withdraw_stake(self):
    caller = master()
    if caller not in self.stakes:
        return {'error': 'No commitment to withdraw'}
    del self.stakes[caller]
    return None


def get_my_stake(self):
    caller = master()
    if caller not in self.stakes:
        return None
    stake = self.stakes[caller].get_dict()
    stake['weight'] = self._conviction_strength(stake)
    return stake


def get_stakes(self):
    return {key: self.stakes[key].get_dict() for key in self.stakes}


def get_total_conviction(self):
    total = 0
    count = 0
    for key in self.stakes:
        stake = self.stakes[key].get_dict()
        total = total + self._conviction_strength(stake)
        count = count + 1
    return {'total': total, 'count': count, 'model': 'time_accrual_v1'}


def get_conviction_by_country(self):
    result = {}
    for key in self.stakes:
        stake = self.stakes[key].get_dict()
        country = stake['country'] if stake['country'] else 'OTHER'
        contribution = self._conviction_strength(stake)
        result[country] = (result[country] + contribution) if country in result else contribution
    return result
