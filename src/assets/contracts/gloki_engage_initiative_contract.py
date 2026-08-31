class GlokiEngageInitiative:

    def __init__(self):
        self.details = Storage('initiative')['details']
        self.stage = Storage('initiative')['stage']
        self.roles = Storage('initiative')['roles']
        self.votes = Storage('problem_vote')
        self.comments = Storage('discussion')
        self.proposals = Storage('proposals')
        self.approvals = Storage('approvals')
        self.qv_config = Storage('qv')['config']
        self.qv_allocations = Storage('qv_allocations')
        self.stakes = Storage('conviction')

    # ─── Details ────────────────────────────────────────────────────────────

    def get_details(self):
        return self.details.get_dict()

    def set_details(self, description, explanation, links, countries):
        if not self.details.exists():
            self.details.update({'author': master(), 'createdAt': timestamp()})
        self.details.update({
            'description': description,
            'explanation': explanation,
            'links': links,
            'countries': countries,
        })

    # ─── Stage gate ─────────────────────────────────────────────────────────

    def get_stage(self):
        return self.stage['value'] or 'problem'

    def set_stage(self, stage):
        self.stage['value'] = stage

    # ─── Roles ──────────────────────────────────────────────────────────────

    def get_roles(self):
        return {
            'author': self.details['author'] or '',
            'coAuthors': self.roles['coAuthors'] or [],
            'experts': self.roles['experts'] or [],
            'endorsementCounts': self.roles['endorsementCounts'] or {},
            'endorsements': self.roles['endorsements'] or {},
            'status': self.roles['status'] or 'active',
            'mergedInto': self.roles['mergedInto'],
        }

    def _recount_endorsements(self, public_key, endorsements):
        count = 0
        for voter in endorsements:
            if public_key in (endorsements[voter] or []):
                count = count + 1
        counts = self.roles['endorsementCounts'] or {}
        counts[public_key] = count
        self.roles['endorsementCounts'] = counts

    def endorse_expert(self, public_key):
        caller = master()
        endorsements = self.roles['endorsements'] or {}
        # endorsements is a plain dict here (read out of Storage), not a
        # Storage document — endorsements[caller] raises KeyError on a
        # first-time endorser, same bug as get_approval_counts above.
        mine = endorsements[caller] if caller in endorsements else []
        if public_key not in mine:
            mine = mine + [public_key]
        endorsements[caller] = mine
        self.roles['endorsements'] = endorsements
        self._recount_endorsements(public_key, endorsements)

        experts = self.roles['experts'] or []
        if public_key not in experts:
            self.roles['experts'] = experts + [public_key]

    def unendorse_expert(self, public_key):
        caller = master()
        endorsements = self.roles['endorsements'] or {}
        mine = endorsements[caller] if caller in endorsements else []
        if public_key in mine:
            mine = [key for key in mine if key != public_key]
        endorsements[caller] = mine
        self.roles['endorsements'] = endorsements
        self._recount_endorsements(public_key, endorsements)

    def add_co_author(self, public_key):
        co_authors = self.roles['coAuthors'] or []
        if public_key not in co_authors:
            self.roles['coAuthors'] = co_authors + [public_key]

    def mark_merged_into(self, target_initiative_id):
        self.roles['status'] = 'merged_into'
        self.roles['mergedInto'] = target_initiative_id

    # ─── Problem vote ───────────────────────────────────────────────────────

    def upvote(self):
        self.votes[master()] = {'vote': 'up'}

    def downvote(self):
        self.votes[master()] = {'vote': 'down'}

    def remove_vote(self):
        caller = master()
        if caller in self.votes:
            del self.votes[caller]

    def get_votes(self):
        return {key: self.votes[key]['vote'] for key in self.votes}

    def get_my_vote(self):
        caller = master()
        if caller in self.votes:
            return self.votes[caller]['vote']
        return None

    def get_tally(self):
        up = 0
        down = 0
        for key in self.votes:
            vote = self.votes[key]['vote']
            if vote == 'up':
                up = up + 1
            elif vote == 'down':
                down = down + 1
        return {'up': up, 'down': down, 'total': up + down}

    # ─── Discussion ─────────────────────────────────────────────────────────

    def add_comment(self, text, parent_id, category, sources):
        # No 'deleted' field here — every other field type in this contract
        # already confirmed working elsewhere is a string, number, or list of
        # strings; a bare Python bool was the one meaningfully different type
        # in this document. Reading an absent field naturally returns None
        # (falsy), matching what delete_comment below now sets on delete.
        comment_id = self.comments.append({
            'author': master(),
            'text': text,
            'parentId': parent_id,
            'timestamp': timestamp(),
            'category': category,
            'sources': sources,
            'likes': [],
        })
        self.comments[comment_id]['id'] = comment_id
        return comment_id

    def delete_comment(self, comment_id):
        if comment_id in self.comments:
            doc = self.comments[comment_id]
            if doc['author'] == master():
                # A timestamp string, not a bool — truthy either way, and the
                # JS side already reads it with `!!raw.deleted`, not `=== true`.
                doc['deleted'] = timestamp()
                doc['text'] = ''

    def like_comment(self, comment_id):
        if comment_id not in self.comments:
            return
        doc = self.comments[comment_id]
        caller = master()
        likes = doc['likes'] or []
        if caller in likes:
            likes = [key for key in likes if key != caller]
        else:
            likes = likes + [caller]
        doc['likes'] = likes

    def get_comments(self):
        # str(key): iterating a collection's own auto-generated ids (unlike a
        # collection keyed by a caller's public key, e.g. self.votes) yields
        # the storage layer's raw internal id object, not the plain string
        # .append() itself returns — using it bare as a dict key crashes JSON
        # serialization ("keys must be str, int, float, bool or None").
        return {str(key): self.comments[key].get_dict() for key in self.comments}

    # ─── Solutions (proposals / approval) ───────────────────────────────────

    def add_proposal(self, text, co_authors, commitments, sources, metrics):
        proposal_id = self.proposals.append({
            'text': text,
            'author': master(),
            'timestamp': timestamp(),
            'coAuthors': co_authors,
            'commitments': commitments,
            'sources': sources,
            'metrics': metrics,
            'expertReviewRequests': [],
            'expertReviews': [],
            'mergeSuggestions': [],
            'mergedInto': None,
        })
        self.proposals[proposal_id]['id'] = proposal_id
        return proposal_id

    # One flat document per (voter, proposal) pair, composite-keyed — not one
    # document per voter holding a nested {proposalId: True} dict. The nested
    # shape (fixed here after get_comments/get_proposals needed the same kind
    # of fix) reliably came back empty on read even though the write
    # succeeded; every field below is a plain string, matching self.votes's
    # already-proven-working shape exactly.
    def approve(self, proposal_id):
        caller = master()
        key = caller + ':' + proposal_id
        self.approvals[key] = {'voter': caller, 'proposalId': proposal_id}

    def withdraw_approval(self, proposal_id):
        caller = master()
        key = caller + ':' + proposal_id
        if key in self.approvals:
            del self.approvals[key]

    def get_proposals(self):
        # Same str(key) fix as get_comments — self.proposals is also keyed by
        # auto-generated append() ids, not by a caller's public key.
        return {str(key): self.proposals[key].get_dict() for key in self.proposals}

    def get_approvals(self):
        # {voter: {proposalId: True, ...}, ...} — regrouped from the flat
        # per-pair documents. Plain iteration + field reads only (the same
        # proven pattern as get_tally), no nested-dict-as-field-value reads.
        result = {}
        for key in self.approvals:
            doc = self.approvals[key]
            voter = doc['voter']
            if voter not in result:
                result[voter] = {}
            result[voter][doc['proposalId']] = True
        return result

    def get_approval_counts(self):
        # counts is a plain Python dict, not a Storage document — counts[id]
        # raises KeyError on a first-seen id (that's the actual server crash
        # reported: "counts[proposal_id] or 0" reads the key before it's ever
        # been set). Storage documents return None on a missing field; plain
        # dicts don't. Must guard with `in`, not rely on falsy-on-missing.
        counts = {}
        for key in self.approvals:
            proposal_id = self.approvals[key]['proposalId']
            counts[proposal_id] = (counts[proposal_id] + 1) if proposal_id in counts else 1
        return counts

    def get_my_approvals(self):
        caller = master()
        result = {}
        for key in self.approvals:
            doc = self.approvals[key]
            if doc['voter'] == caller:
                result[doc['proposalId']] = True
        return result

    def request_expert_review(self, proposal_id):
        if proposal_id not in self.proposals:
            return
        doc = self.proposals[proposal_id]
        requests = doc['expertReviewRequests'] or []
        caller = master()
        if caller not in requests:
            doc['expertReviewRequests'] = requests + [caller]

    def add_expert_review(self, proposal_id, metrics, note='', assessment='', sources=None, credentials=''):
        if proposal_id not in self.proposals:
            return
        doc = self.proposals[proposal_id]
        reviews = doc['expertReviews'] or []
        doc['expertReviews'] = reviews + [{
            'expert': master(),
            'metrics': metrics,
            'note': note,
            'assessment': assessment,
            'credentials': credentials,
            'sources': sources or [],
            'timestamp': timestamp(),
        }]

    def suggest_proposal_merge(self, source_id, target_id):
        if source_id not in self.proposals:
            return
        doc = self.proposals[source_id]
        suggestions = doc['mergeSuggestions'] or []
        doc['mergeSuggestions'] = suggestions + [{
            'target': target_id,
            'suggester': master(),
            'timestamp': timestamp(),
        }]

    def decide_merge_suggestion(self, source_id, target_id, decision):
        if source_id not in self.proposals:
            return
        doc = self.proposals[source_id]
        suggestions = doc['mergeSuggestions'] or []
        updated = []
        for suggestion in suggestions:
            if suggestion['target'] == target_id:
                suggestion['decision'] = decision
            updated.append(suggestion)
        doc['mergeSuggestions'] = updated
        if decision == 'accepted':
            doc['mergedInto'] = target_id

    # ─── Vote (quadratic) ───────────────────────────────────────────────────

    def get_config(self):
        if not self.qv_config.exists():
            return {'credits_per_voter': 100, 'status': 'open'}
        return self.qv_config.get_dict()

    def set_credits(self, credits):
        self.qv_config['credits_per_voter'] = credits

    def set_status(self, status):
        self.qv_config['status'] = status

    def allocate(self, allocations):
        self.qv_allocations[master()] = {'items': allocations}

    def get_allocations(self):
        return {key: (self.qv_allocations[key]['items'] or {}) for key in self.qv_allocations}

    def get_my_allocation(self):
        caller = master()
        if caller in self.qv_allocations:
            return self.qv_allocations[caller]['items'] or {}
        return {}

    def get_results(self):
        # Same accumulator bug class as get_approval_counts — totals is a
        # plain dict, so totals[id] raises KeyError on a first-seen id.
        totals = {}
        for voter in self.qv_allocations:
            items = self.qv_allocations[voter]['items'] or {}
            for proposal_id in items:
                score = items[proposal_id] ** 0.5
                totals[proposal_id] = (totals[proposal_id] + score) if proposal_id in totals else score
        return totals

    # ─── Mandate (conviction staking) ───────────────────────────────────────
    # Duration multipliers match the demo mock exactly (S33: one backing per
    # person — `stake` rejects a second call; only `update_stake` may change
    # an existing commitment, and shortening the duration restarts its clock
    # while lengthening preserves the original backing date).

    def _duration_multiplier(self, duration):
        multipliers = {'1w': 1, '1m': 2, '3m': 4, '6m': 7, '1y': 12}
        return multipliers[duration] if duration in multipliers else None

    def stake(self, amount, duration, country):
        if amount <= 0:
            return {'error': 'Stake amount must be positive'}
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
        if caller in self.stakes:
            return self.stakes[caller].get_dict()
        return None

    def get_stakes(self):
        return {key: self.stakes[key].get_dict() for key in self.stakes}

    def get_total_conviction(self):
        total = 0
        count = 0
        for key in self.stakes:
            stake = self.stakes[key].get_dict()
            mult = self._duration_multiplier(stake['duration']) or 1
            total = total + stake['amount'] * mult
            count = count + 1
        return {'total': total, 'count': count}

    def get_conviction_by_country(self):
        # Same accumulator bug class as get_approval_counts — result is a
        # plain dict, so result[country] raises KeyError on a first-seen
        # country.
        result = {}
        for key in self.stakes:
            stake = self.stakes[key].get_dict()
            mult = self._duration_multiplier(stake['duration']) or 1
            country = stake['country'] if stake['country'] else 'OTHER'
            contribution = stake['amount'] * mult
            result[country] = (result[country] + contribution) if country in result else contribution
        return result
