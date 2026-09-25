# Ballot guards for server-side/src/assets/contracts/gloki_engage_initiative_contract.py.
# Re-verified against origin/server-side @ d930a9e on 2026-09-25 (the contract is
# byte-identical to 3b563fa, where the gap was found).
#
# Today every setter below accepts any identity key, and allocate stores whatever it
# is sent. get_results sums sqrt(credits) per voter, so one direct caller with 10,000
# credits casts 100 votes against a rule-following voter's 10 — the locked 1p1v / QV
# decision holds only as long as nobody calls the contract without the UI.
#
# Rulings (Eston, 2026-09-25):
#   R1  set_stage and set_details: the initiative's author or a co-author only (the
#       UI's isAuthorOrCoAuthor). add_co_author gets the same guard — otherwise any
#       key could make itself a co-author and pass every other guard.
#   R2  After creation, set_details may change the text only in the Problem stage.
#   R3  set_credits / set_status are fixed: 100 credits per voter, and the vote is
#       open exactly while the stage is 'vote'.
#   R4  One final ballot per person.
# Beyond R1–R4, matching what the UI and the demo stub already do: set_stage only
# accepts the next stage in order, and remove_vote closes with upvote/downvote
# when the Problem stage ends.
#
# Inside class GlokiEngageInitiative:
#   - ADD the four private helpers in the first block below.
#   - REPLACE these ten methods with the versions below: set_details, set_stage,
#     add_co_author, upvote, downvote, remove_vote, get_config, set_credits,
#     set_status, allocate.
# No imports, no new Storage() entries, no __init__ change, and every public method
# keeps its name and arguments. The only builtin used is str(), which this contract
# already relies on (get_proposals). Shares no method with the unapplied S34 and S40
# patches, so the three apply in any order.
#
# Every refusal returns {'error': ...} and writes nothing (the stake / update_stake
# convention); success returns None. Only initiatives deployed after this lands are
# guarded — deployed contracts are immutable and keep the open methods.
#
# Voter eligibility (members-only / verified-only stages) is deliberately NOT here:
# it waits on the G2 trust-root decision. Remaining gaps are listed in
# docs/FOR_OURI_seam.md, "2026-09-25 addendum".

# ─── Private helpers (add) ──────────────────────────────────────────────────

def _stage_order(self):
    return ['problem', 'discussion', 'proposals', 'vote', 'mandate']


def _is_author_or_co_author(self, key):
    # Same rule as the UI's isAuthorOrCoAuthor (src/services/initiativeRoles.ts).
    if key == self.details['author']:
        return True
    return key in (self.roles['coAuthors'] or [])


def _credits_per_voter(self):
    return 100  # R3: fixed, and the same for every voter


def _is_whole_number(self, value):
    # A JSON integer >= 0 is the only value whose str() is all digits and that is
    # not itself a str. true ('True'), 2.5, 4.0, -4, null ('None'), lists and
    # objects all fail. str() only, on purpose: isinstance / int / bool / dict are
    # unconfirmed in the sandbox, and an unknown name here would stop every ballot.
    text = str(value)
    if text == value or text == '':
        return False
    for ch in text:
        if ch not in '0123456789':
            return False
    return True


# ─── Details (replace) ──────────────────────────────────────────────────────

def set_details(self, description, explanation, links, countries):
    caller = master()
    if not self.details.exists():
        # Creation, unchanged: the first writer becomes the author.
        # createInitiativeOnChain calls this straight after the deploy, before the
        # contract id is published to the community.
        self.details.update({'author': caller, 'createdAt': timestamp()})
    else:
        if not self._is_author_or_co_author(caller):
            return {'error': 'Only the author or a co-author can edit this initiative'}
        if self.get_stage() != 'problem':
            return {'error': 'The initiative text is frozen after the Problem stage'}
    self.details.update({
        'description': description,
        'explanation': explanation,
        'links': links,
        'countries': countries,
    })
    return None


# ─── Stage gate (replace) ───────────────────────────────────────────────────
# Same order and messages as the ui demo stub (demoContracts/initiative.ts).
# Readiness thresholds (e.g. half the members seconding) stay UI-only: the
# member count lives on the community contract.

def set_stage(self, stage):
    if not self._is_author_or_co_author(master()):
        return {'error': 'Only the author or a co-author can advance the stage'}
    order = self._stage_order()
    if stage not in order:
        return {'error': 'Invalid stage'}
    current = self.get_stage()
    if current not in order or order.index(stage) != order.index(current) + 1:
        return {'error': 'Stages can only advance one step at a time'}
    self.stage['value'] = stage
    return None


# ─── Roles (replace add_co_author) ──────────────────────────────────────────
# Both UI callers — accepting a modification, and accepting a merge INTO this
# initiative — already run as its author or a co-author.

def add_co_author(self, public_key):
    if not self._is_author_or_co_author(master()):
        return {'error': 'Only the author or a co-author can add a co-author'}
    co_authors = self.roles['coAuthors'] or []
    if public_key not in co_authors:
        self.roles['coAuthors'] = co_authors + [public_key]
    return None


# ─── Problem vote (replace) ─────────────────────────────────────────────────
# Open only in the Problem stage, the only stage where the UI shows the control.
# remove_vote closes with it, so the tally that justified the advance stays put.

def upvote(self):
    if self.get_stage() != 'problem':
        return {'error': 'Problem voting is closed'}
    self.votes[master()] = {'vote': 'up'}
    return None


def downvote(self):
    if self.get_stage() != 'problem':
        return {'error': 'Problem voting is closed'}
    self.votes[master()] = {'vote': 'down'}
    return None


def remove_vote(self):
    if self.get_stage() != 'problem':
        return {'error': 'Problem voting is closed'}
    caller = master()
    if caller in self.votes:
        del self.votes[caller]
    return None


# ─── Vote (quadratic) (replace get_config, set_credits, set_status, allocate) ─

def get_config(self):
    # Computed, never stored (R3); same shape as before. Writes nothing, so it
    # stays safe as a read. The UI uses credits_per_voter as the heart pool.
    return {
        'credits_per_voter': self._credits_per_voter(),
        'status': 'open' if self.get_stage() == 'vote' else 'closed',
    }


def set_credits(self, credits):
    return {'error': 'The vote budget is fixed at 100 credits per voter'}


def set_status(self, status):
    return {'error': 'Voting opens and closes with the Vote stage'}


def allocate(self, allocations):
    # Messages match the ui demo stub (demoContracts/qv.ts) where the rule is shared.
    caller = master()
    if self.get_stage() != 'vote':
        return {'error': 'Voting is not open'}
    if caller in self.qv_allocations:
        return {'error': 'You have already voted'}  # R4: the ballot is final
    # A JSON object is the only value whose str() starts with '{' and that is not
    # itself a str (str() only, as in _is_whole_number).
    shape = str(allocations)
    if shape == allocations or shape[:1] != '{':
        return {'error': 'Allocations must be an object'}
    # Valid ids exactly as get_proposals hands them to the UI: str() of each
    # append() ObjectId. Deliberately not `proposal_id in self.proposals` —
    # Collection.__contains__ matches _id without turning a hex string into an
    # ObjectId, so that test is always False here and would refuse every ballot
    # (the S35 D1 question in docs/FOR_OURI_seam.md).
    known = {}
    for key in self.proposals:
        known[str(key)] = True
    cleaned = {}
    total = 0
    for proposal_id in allocations:
        credits = allocations[proposal_id]
        if proposal_id not in known:
            return {'error': 'Unknown proposal'}
        if not self._is_whole_number(credits):
            return {'error': 'Credits must be whole numbers'}
        if credits == 0:
            continue
        cleaned[proposal_id] = credits
        total = total + credits
    if total == 0:
        return {'error': 'Ballot is empty'}  # keeps "voted" == "has a non-empty ballot", as the UI derives it
    if total > self._credits_per_voter():
        return {'error': 'Exceeds credit budget'}
    self.qv_allocations[caller] = {'items': cleaned}
    return None
