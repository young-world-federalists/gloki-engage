# Additions to gloki_engage_initiative_contract.py (server-side). Four additive
# methods (vote_comment, get_comment_votes, add_impact_assessment,
# get_impact_assessments) PLUS one signature replacement: add_proposal gains a
# trailing cause_id='' parameter. This is NOT additive-only — the UI sends
# cause_id on every add_proposal call from this merge onward, so the
# add_proposal hunk below must be applied in the same change as the merge or
# solution submission fails on the live site.
# S35 / rulings D4, D5, F1, F2, D12. Apply inside class GlokiEngageInitiative.
# Also: vote_comment refuses soft-deleted roots (mirrors the ui demo stub).

# __init__ additions
#     self.comment_votes = Storage('comment_votes')          # F1: flat, key = caller + ':' + comment_id
#     self.impact_assessments = Storage('impact_assessments') # F1: flat, key = proposal_id + ':' + caller

# ─── Causes: up/down on ROOT comments only (D4) ─────────────────────────────
def vote_comment(self, comment_id, direction):
    # direction: 'up' | 'down' | 'none' ('none' removes the caller's vote). 1p1v.
    caller = master()
    if comment_id not in self.comments:
        return
    if self.comments[comment_id]['parentId']:
        return  # replies are not causes; they keep like_comment
    if self.comments[comment_id]['deleted']:
        return  # soft-deleted roots are not causes
    key = caller + ':' + comment_id
    if direction == 'none':
        if key in self.comment_votes:
            del self.comment_votes[key]
        return
    if direction != 'up' and direction != 'down':
        return
    self.comment_votes[key] = {'voter': caller, 'commentId': comment_id, 'direction': direction}

def get_comment_votes(self):
    return {str(key): self.comment_votes[key].get_dict() for key in self.comment_votes}

# ─── Solutions: cause alignment (D5, F2) — replace the existing signature ────
def add_proposal(self, text, co_authors, commitments, sources, metrics, cause_id=''):
    proposal_id = self.proposals.append({
        'text': text,
        'author': master(),
        'timestamp': timestamp(),
        'coAuthors': co_authors,
        'commitments': commitments,
        'sources': sources,
        'metrics': metrics,
        'causeId': cause_id,          # immutable once written (F2); '' = proposed before any cause was ranked
        'expertReviewRequests': [],
        'expertReviews': [],
        'mergeSuggestions': [],
        'mergedInto': None,
    })
    self.proposals[proposal_id]['id'] = proposal_id
    return proposal_id

# ─── Impact assessment (W4). Eligibility is UI-gated (D12); the contract enforces
#     only: proposal exists, max 3 per proposal, one per author. ────────────────
def add_impact_assessment(self, proposal_id, target, targets_cause, mechanism,
                          broader_effects, risks, opportunity_costs, time_horizon):
    caller = master()
    if proposal_id not in self.proposals:
        return
    existing = [k for k in self.impact_assessments if self.impact_assessments[k]['proposalId'] == proposal_id]
    if len(existing) >= 3:
        return
    for k in existing:
        if self.impact_assessments[k]['author'] == caller:
            return
    key = proposal_id + ':' + caller
    self.impact_assessments[key] = {
        'author': caller, 'proposalId': proposal_id, 'timestamp': timestamp(),
        'target': target, 'targetsCause': targets_cause, 'mechanism': mechanism,
        'broaderEffects': broader_effects, 'risks': risks,
        'opportunityCosts': opportunity_costs, 'timeHorizon': time_horizon,
    }

def get_impact_assessments(self):
    return {str(key): self.impact_assessments[key].get_dict() for key in self.impact_assessments}
