// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// One initiative (an issue) and every stage of it. Its creator deploys it on
// their own node and makes their copy public, so anyone can read it; members
// act on it as guests. Every action is the signer's own (msg.sender). The
// get_my_* reads take the reader's address, because a public read has no
// signer.
//
// It is too big for one EVM contract, so the root (details, stage, roles,
// problem vote, discussion, properties) creates two parts in its world:
// Solutions (proposals, approvals, reviews, merges, assessments) and Decision
// (the quadratic vote and conviction). Members call a part at its address
// (get_parts), and still act as themselves.

interface IInitiativeRoot {
    function get_stage() external view returns (string memory);
    function is_author_or_co_author(address key) external view returns (bool);
    function is_expert(address key) external view returns (bool);
}

interface ISolutions {
    function proposal_count() external view returns (uint256);
}

library Text {
    function eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}

contract GlokiEngageInitiative is IInitiativeRoot {
    struct Details {
        address author;
        uint256 createdAt;
        string description;
        string explanation;
        string[] links;
        string[] countries;
    }

    struct Endorsement {
        address voter;
        address[] keys;
    }

    struct Roles {
        address author;
        address[] coAuthors;
        address[] experts;
        Endorsement[] endorsements;
        string status; // active | merged_into
        string mergedInto;
    }

    struct VoteView {
        address agent;
        string vote; // up | down
    }

    struct Comment {
        uint256 id;
        address author;
        string text;
        uint256 parentId; // 0 = a root comment
        uint256 timestamp;
        string category;
        string sources; // JSON, as the app sends it
        address[] likes;
        bool deleted;
    }

    struct CommentVote {
        address voter;
        uint256 commentId;
        string direction; // up | down
    }

    struct Property {
        string key;
        string value;
    }

    Details private details;
    string private stage = "problem";
    address public solutions;
    address public decision;

    address[] private coAuthors;
    address[] private experts;
    address[] private endorsers;
    mapping(address => address[]) private endorsementsBy;
    string private status = "active";
    string private mergedInto;

    address[] private voters;
    mapping(address => uint8) private problemVote; // 0 none, 1 up, 2 down

    Comment[] private comments; // id = index + 1
    CommentVote[] private commentVotes;
    mapping(bytes32 => uint256) private commentVoteIndex; // 1-based

    string[] private propertyKeys;
    mapping(string => string) private properties;
    mapping(string => bool) private hasProperty;

    constructor(
        string memory description,
        string memory explanation,
        string[] memory links,
        string[] memory countries
    ) {
        details.author = msg.sender;
        details.createdAt = block.timestamp;
        _setText(description, explanation, links, countries);
        Solutions s = new Solutions(this);
        solutions = address(s);
        decision = address(new Decision(this, s));
    }

    function approve_guest(address) external pure returns (bool) {
        return true;
    }

    modifier onlyAuthors(string memory refusal) {
        require(is_author_or_co_author(msg.sender), refusal);
        _;
    }

    function get_parts() external view returns (address solutions_at, address decision_at) {
        return (solutions, decision);
    }

    // ─── Details and stage ──────────────────────────────────────────────────

    function get_details() external view returns (Details memory) {
        return details;
    }

    function set_details(
        string memory description,
        string memory explanation,
        string[] memory links,
        string[] memory countries
    ) external onlyAuthors("Only the author or a co-author can edit this initiative") {
        require(Text.eq(stage, "problem"), "The initiative text is frozen after the Problem stage");
        _setText(description, explanation, links, countries);
    }

    function get_stage() external view returns (string memory) {
        return stage;
    }

    function set_stage(string memory next) external onlyAuthors("Only the author or a co-author can advance the stage") {
        int256 to = _stageOrder(next);
        require(to >= 0, "Invalid stage");
        require(to == _stageOrder(stage) + 1, "Stages can only advance one step at a time");
        stage = next;
    }

    // ─── Roles ──────────────────────────────────────────────────────────────

    function get_roles() external view returns (Roles memory roles) {
        roles.author = details.author;
        roles.coAuthors = coAuthors;
        roles.experts = experts;
        roles.endorsements = new Endorsement[](endorsers.length);
        for (uint256 i = 0; i < endorsers.length; i++) {
            roles.endorsements[i] = Endorsement(endorsers[i], endorsementsBy[endorsers[i]]);
        }
        roles.status = status;
        roles.mergedInto = mergedInto;
    }

    function is_author_or_co_author(address key) public view returns (bool) {
        return key == details.author || _contains(coAuthors, key);
    }

    function is_expert(address key) external view returns (bool) {
        return _contains(experts, key);
    }

    function endorse_expert(address public_key) external {
        address[] storage mine = endorsementsBy[msg.sender];
        if (!_contains(endorsers, msg.sender)) endorsers.push(msg.sender);
        if (!_contains(mine, public_key)) mine.push(public_key);
        if (!_contains(experts, public_key)) experts.push(public_key);
    }

    function unendorse_expert(address public_key) external {
        _remove(endorsementsBy[msg.sender], public_key);
    }

    function add_co_author(address public_key) external onlyAuthors("Only the author or a co-author can add a co-author") {
        if (!_contains(coAuthors, public_key)) coAuthors.push(public_key);
    }

    function mark_merged_into(string memory target_initiative_id)
        external
        onlyAuthors("Only the author or a co-author can mark this initiative merged")
    {
        status = "merged_into";
        mergedInto = target_initiative_id;
    }

    // ─── Problem vote ───────────────────────────────────────────────────────

    function upvote() external {
        _setProblemVote(1);
    }

    function downvote() external {
        _setProblemVote(2);
    }

    function remove_vote() external {
        _setProblemVote(0);
    }

    function get_votes() external view returns (VoteView[] memory out) {
        uint256 n = 0;
        for (uint256 i = 0; i < voters.length; i++) if (problemVote[voters[i]] != 0) n++;
        out = new VoteView[](n);
        n = 0;
        for (uint256 i = 0; i < voters.length; i++) {
            uint8 v = problemVote[voters[i]];
            if (v != 0) out[n++] = VoteView(voters[i], v == 1 ? "up" : "down");
        }
    }

    function get_my_vote(address agent) external view returns (string memory) {
        uint8 v = problemVote[agent];
        return v == 1 ? "up" : v == 2 ? "down" : "";
    }

    function get_tally() external view returns (uint256 up, uint256 down, uint256 total) {
        for (uint256 i = 0; i < voters.length; i++) {
            uint8 v = problemVote[voters[i]];
            if (v == 1) up++;
            else if (v == 2) down++;
        }
        total = up + down;
    }

    // ─── Discussion ─────────────────────────────────────────────────────────

    function add_comment(string memory text, uint256 parent_id, string memory category, string memory sources)
        external
        returns (uint256 id)
    {
        require(parent_id <= comments.length, "Unknown comment");
        id = comments.length + 1;
        Comment storage c = comments.push();
        c.id = id;
        c.author = msg.sender;
        c.text = text;
        c.parentId = parent_id;
        c.timestamp = block.timestamp;
        c.category = category;
        c.sources = sources;
    }

    function delete_comment(uint256 comment_id) external {
        Comment storage c = _comment(comment_id);
        require(c.author == msg.sender, "Only the author can delete a comment");
        c.deleted = true;
        c.text = "";
    }

    function like_comment(uint256 comment_id) external {
        Comment storage c = _comment(comment_id);
        if (!_remove(c.likes, msg.sender)) c.likes.push(msg.sender);
    }

    function get_comments() external view returns (Comment[] memory) {
        return comments;
    }

    // Causes: up/down on root comments only; 'none' removes the caller's vote.
    function vote_comment(uint256 comment_id, string memory direction) external {
        Comment storage c = _comment(comment_id);
        require(c.parentId == 0, "Only a root comment can be voted on");
        require(!c.deleted, "This comment was deleted");
        bool none = Text.eq(direction, "none");
        require(none || Text.eq(direction, "up") || Text.eq(direction, "down"), "Invalid direction");
        bytes32 key = keccak256(abi.encodePacked(msg.sender, comment_id));
        uint256 i = commentVoteIndex[key];
        if (i == 0) {
            if (none) return;
            commentVotes.push(CommentVote(msg.sender, comment_id, direction));
            commentVoteIndex[key] = commentVotes.length;
        } else {
            commentVotes[i - 1].direction = none ? "" : direction;
        }
    }

    function get_comment_votes() external view returns (CommentVote[] memory out) {
        uint256 n = 0;
        for (uint256 i = 0; i < commentVotes.length; i++) if (bytes(commentVotes[i].direction).length > 0) n++;
        out = new CommentVote[](n);
        n = 0;
        for (uint256 i = 0; i < commentVotes.length; i++) {
            if (bytes(commentVotes[i].direction).length > 0) out[n++] = commentVotes[i];
        }
    }

    // ─── Property bag (mandate ratification) ────────────────────────────────

    function get_properties() external view returns (Property[] memory out) {
        out = new Property[](propertyKeys.length);
        for (uint256 i = 0; i < propertyKeys.length; i++) out[i] = Property(propertyKeys[i], properties[propertyKeys[i]]);
    }

    function set_property(string memory key, string memory value)
        external
        onlyAuthors("Only the author or a co-author can change this initiative")
    {
        if (!hasProperty[key]) {
            hasProperty[key] = true;
            propertyKeys.push(key);
        }
        properties[key] = value;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    function _setText(
        string memory description,
        string memory explanation,
        string[] memory links,
        string[] memory countries
    ) private {
        details.description = description;
        details.explanation = explanation;
        details.links = links;
        details.countries = countries;
    }

    function _setProblemVote(uint8 v) private {
        require(Text.eq(stage, "problem"), "Problem voting is closed");
        if (v != 0 && !_contains(voters, msg.sender)) voters.push(msg.sender);
        problemVote[msg.sender] = v;
    }

    function _stageOrder(string memory s) private pure returns (int256) {
        bytes32 k = keccak256(bytes(s));
        if (k == keccak256("problem")) return 0;
        if (k == keccak256("discussion")) return 1;
        if (k == keccak256("proposals")) return 2;
        if (k == keccak256("vote")) return 3;
        if (k == keccak256("mandate")) return 4;
        return -1;
    }

    function _comment(uint256 id) private view returns (Comment storage) {
        require(id >= 1 && id <= comments.length, "Unknown comment");
        return comments[id - 1];
    }

    function _contains(address[] storage list, address a) private view returns (bool) {
        for (uint256 i = 0; i < list.length; i++) if (list[i] == a) return true;
        return false;
    }

    function _remove(address[] storage list, address a) private returns (bool) {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == a) {
                list[i] = list[list.length - 1];
                list.pop();
                return true;
            }
        }
        return false;
    }
}

// Solutions: proposals, approvals, expert reviews, merge suggestions, impact
// assessments.
contract Solutions is ISolutions {
    uint256 private constant MAX_ASSESSMENTS = 3;

    struct ExpertReview {
        address expert;
        string[] metrics;
        string note;
        string assessment;
        string credentials;
        string sources; // JSON
        uint256 timestamp;
    }

    struct MergeSuggestion {
        uint256 target;
        address suggester;
        uint256 timestamp;
        string decision; // '' | accepted | declined
    }

    struct Proposal {
        uint256 id;
        string text;
        address author;
        uint256 timestamp;
        string[] coAuthors;
        string[] commitments;
        string sources; // JSON
        string[] metrics;
        string causeId;
        address[] expertReviewRequests;
        ExpertReview[] expertReviews;
        MergeSuggestion[] mergeSuggestions;
        uint256 mergedInto; // 0 = not merged
    }

    struct Approval {
        address voter;
        uint256 proposalId;
    }

    struct Assessment {
        address author;
        uint256 proposalId;
        uint256 timestamp;
        string target;
        string targetsCause; // cause | symptom | both
        string mechanism;
        string broaderEffects;
        string risks;
        string opportunityCosts;
        string timeHorizon;
    }

    IInitiativeRoot private immutable root;
    Proposal[] private proposals; // id = index + 1
    Approval[] private approvals;
    mapping(bytes32 => uint256) private approvalIndex; // 1-based; 0 = none or withdrawn
    Assessment[] private assessments;

    constructor(IInitiativeRoot root_) {
        root = root_;
    }

    modifier solutionsOpen() {
        string memory s = root.get_stage();
        require(!Text.eq(s, "vote") && !Text.eq(s, "mandate"), "Solutions are closed");
        _;
    }

    function proposal_count() external view returns (uint256) {
        return proposals.length;
    }

    function add_proposal(
        string memory text,
        string[] memory co_authors,
        string[] memory commitments,
        string memory sources,
        string[] memory metrics,
        string memory cause_id
    ) external solutionsOpen returns (uint256 id) {
        id = proposals.length + 1;
        Proposal storage p = proposals.push();
        p.id = id;
        p.text = text;
        p.author = msg.sender;
        p.timestamp = block.timestamp;
        p.coAuthors = co_authors;
        p.commitments = commitments;
        p.sources = sources;
        p.metrics = metrics;
        p.causeId = cause_id;
    }

    function approve(uint256 proposal_id) external solutionsOpen {
        _proposal(proposal_id);
        bytes32 key = keccak256(abi.encodePacked(msg.sender, proposal_id));
        if (approvalIndex[key] != 0) return;
        approvals.push(Approval(msg.sender, proposal_id));
        approvalIndex[key] = approvals.length;
    }

    function withdraw_approval(uint256 proposal_id) external solutionsOpen {
        delete approvalIndex[keccak256(abi.encodePacked(msg.sender, proposal_id))];
    }

    function get_proposals() external view returns (Proposal[] memory) {
        return proposals;
    }

    function get_approvals() external view returns (Approval[] memory out) {
        uint256 n = 0;
        for (uint256 i = 0; i < approvals.length; i++) if (_isLiveApproval(i)) n++;
        out = new Approval[](n);
        n = 0;
        for (uint256 i = 0; i < approvals.length; i++) if (_isLiveApproval(i)) out[n++] = approvals[i];
    }

    function request_expert_review(uint256 proposal_id) external {
        Proposal storage p = _proposal(proposal_id);
        for (uint256 i = 0; i < p.expertReviewRequests.length; i++) if (p.expertReviewRequests[i] == msg.sender) return;
        p.expertReviewRequests.push(msg.sender);
    }

    // One review per expert per proposal: a second one replaces the first.
    function add_expert_review(
        uint256 proposal_id,
        string[] memory metrics,
        string memory note,
        string memory assessment,
        string memory sources,
        string memory credentials
    ) external {
        Proposal storage p = _proposal(proposal_id);
        require(root.is_expert(msg.sender), "Only an endorsed expert can review a solution");
        uint256 i = 0;
        while (i < p.expertReviews.length && p.expertReviews[i].expert != msg.sender) i++;
        ExpertReview storage r = i < p.expertReviews.length ? p.expertReviews[i] : p.expertReviews.push();
        r.expert = msg.sender;
        r.metrics = metrics;
        r.note = note;
        r.assessment = assessment;
        r.credentials = credentials;
        r.sources = sources;
        r.timestamp = block.timestamp;
    }

    function suggest_proposal_merge(uint256 source_id, uint256 target_id) external {
        Proposal storage p = _proposal(source_id);
        _proposal(target_id);
        for (uint256 i = 0; i < p.mergeSuggestions.length; i++) {
            if (p.mergeSuggestions[i].target == target_id && p.mergeSuggestions[i].suggester == msg.sender) return;
        }
        p.mergeSuggestions.push(MergeSuggestion(target_id, msg.sender, block.timestamp, ""));
    }

    function decide_merge_suggestion(uint256 source_id, uint256 target_id, string memory decision) external {
        Proposal storage p = _proposal(source_id);
        require(p.author == msg.sender, "Only the solution's author can answer a merge suggestion");
        bool accepted = Text.eq(decision, "accepted");
        require(accepted || Text.eq(decision, "declined"), "Invalid decision");
        for (uint256 i = 0; i < p.mergeSuggestions.length; i++) {
            if (p.mergeSuggestions[i].target == target_id) p.mergeSuggestions[i].decision = decision;
        }
        if (accepted) p.mergedInto = target_id;
    }

    // Eligibility is UI-gated (D12); the contract enforces: the proposal exists,
    // at most three per proposal, one per author, and every field filled in.
    function add_impact_assessment(
        uint256 proposal_id,
        string memory target,
        string memory targets_cause,
        string memory mechanism,
        string memory broader_effects,
        string memory risks,
        string memory opportunity_costs,
        string memory time_horizon
    ) external {
        _proposal(proposal_id);
        uint256 count = 0;
        for (uint256 i = 0; i < assessments.length; i++) {
            if (assessments[i].proposalId != proposal_id) continue;
            require(assessments[i].author != msg.sender, "You already assessed this solution");
            count++;
        }
        require(count < MAX_ASSESSMENTS, "This solution already has three assessments");
        require(
            Text.eq(targets_cause, "cause") || Text.eq(targets_cause, "symptom") || Text.eq(targets_cause, "both"),
            "Invalid cause target"
        );
        require(
            bytes(target).length > 0 && bytes(mechanism).length > 0 && bytes(broader_effects).length > 0
                && bytes(risks).length > 0 && bytes(opportunity_costs).length > 0 && bytes(time_horizon).length > 0,
            "Every field is required"
        );
        Assessment storage a = assessments.push();
        a.author = msg.sender;
        a.proposalId = proposal_id;
        a.timestamp = block.timestamp;
        a.target = target;
        a.targetsCause = targets_cause;
        a.mechanism = mechanism;
        a.broaderEffects = broader_effects;
        a.risks = risks;
        a.opportunityCosts = opportunity_costs;
        a.timeHorizon = time_horizon;
    }

    function get_impact_assessments() external view returns (Assessment[] memory) {
        return assessments;
    }

    function _proposal(uint256 id) private view returns (Proposal storage) {
        require(id >= 1 && id <= proposals.length, "Unknown proposal");
        return proposals[id - 1];
    }

    function _isLiveApproval(uint256 i) private view returns (bool) {
        return approvalIndex[keccak256(abi.encodePacked(approvals[i].voter, approvals[i].proposalId))] == i + 1;
    }
}

// Decision: the quadratic vote and the mandate's conviction.
contract Decision {
    uint256 private constant CREDITS_PER_VOTER = 100;
    uint256 private constant MONTH = 30 * 24 * 60 * 60;

    struct Ballot {
        address voter;
        uint256[] proposalIds;
        uint256[] credits;
    }

    struct Stake {
        address voter;
        uint256 amount;
        string duration; // 1w | 1m | 3m | 6m | 1y
        uint256 timestamp;
        string country;
        uint256 weight; // strength now, in thousandths (reads only)
    }

    IInitiativeRoot private immutable root;
    ISolutions private immutable solutions;
    Ballot[] private ballots;
    mapping(address => uint256) private ballotIndex; // 1-based
    Stake[] private stakes;
    mapping(address => uint256) private stakeIndex; // 1-based; 0 = none or withdrawn

    constructor(IInitiativeRoot root_, ISolutions solutions_) {
        root = root_;
        solutions = solutions_;
    }

    // ─── Vote (quadratic) ───────────────────────────────────────────────────

    function get_config() external view returns (uint256 credits_per_voter, string memory vote_status) {
        return (CREDITS_PER_VOTER, Text.eq(root.get_stage(), "vote") ? "open" : "closed");
    }

    // One final ballot per person, within the budget, in the vote stage.
    function allocate(uint256[] memory proposal_ids, uint256[] memory credits) external {
        require(Text.eq(root.get_stage(), "vote"), "Voting is not open");
        require(ballotIndex[msg.sender] == 0, "You have already voted");
        require(proposal_ids.length == credits.length, "Allocations must be an object");
        uint256 count = solutions.proposal_count();
        uint256 total = 0;
        uint256 kept = 0;
        for (uint256 i = 0; i < proposal_ids.length; i++) {
            require(proposal_ids[i] >= 1 && proposal_ids[i] <= count, "Unknown proposal");
            for (uint256 j = 0; j < i; j++) require(proposal_ids[j] != proposal_ids[i], "Each proposal may be listed once");
            total += credits[i];
            if (credits[i] > 0) kept++;
        }
        require(kept > 0, "Ballot is empty");
        require(total <= CREDITS_PER_VOTER, "Exceeds credit budget");
        Ballot storage b = ballots.push();
        b.voter = msg.sender;
        for (uint256 i = 0; i < proposal_ids.length; i++) {
            if (credits[i] == 0) continue;
            b.proposalIds.push(proposal_ids[i]);
            b.credits.push(credits[i]);
        }
        ballotIndex[msg.sender] = ballots.length;
    }

    function get_allocations() external view returns (Ballot[] memory) {
        return ballots;
    }

    function get_my_allocation(address agent) external view returns (Ballot memory b) {
        uint256 i = ballotIndex[agent];
        if (i != 0) b = ballots[i - 1];
    }

    // ─── Mandate (conviction) ───────────────────────────────────────────────
    // One backing per person, worth exactly 1, whose strength grows with time
    // up to its duration's cap.

    function stake(uint256 amount, string memory duration, string memory country) external {
        require(amount == 1, "Stake amount must be exactly 1");
        require(_durationCap(duration) > 0, "Invalid duration");
        require(stakeIndex[msg.sender] == 0, unicode"Already backing — use update_stake");
        stakes.push(Stake(msg.sender, amount, duration, block.timestamp, bytes(country).length > 0 ? country : "OTHER", 0));
        stakeIndex[msg.sender] = stakes.length;
    }

    // Lengthening keeps the original date; shortening restarts the clock.
    function update_stake(string memory duration, string memory country) external {
        uint256 cap = _durationCap(duration);
        require(cap > 0, "Invalid duration");
        uint256 i = stakeIndex[msg.sender];
        require(i != 0, "No commitment to change");
        Stake storage s = stakes[i - 1];
        if (cap < _durationCap(s.duration)) s.timestamp = block.timestamp;
        s.duration = duration;
        if (bytes(country).length > 0) s.country = country;
    }

    function withdraw_stake() external {
        require(stakeIndex[msg.sender] != 0, "No commitment to withdraw");
        delete stakeIndex[msg.sender];
    }

    function get_my_stake(address agent) external view returns (bool found, Stake memory backing) {
        uint256 i = stakeIndex[agent];
        if (i == 0) return (false, backing);
        backing = stakes[i - 1];
        backing.weight = _strength(backing);
        found = true;
    }

    function get_stakes() external view returns (Stake[] memory out) {
        uint256 n = 0;
        for (uint256 i = 0; i < stakes.length; i++) if (_isLiveStake(i)) n++;
        out = new Stake[](n);
        n = 0;
        for (uint256 i = 0; i < stakes.length; i++) {
            if (!_isLiveStake(i)) continue;
            out[n] = stakes[i];
            out[n].weight = _strength(stakes[i]);
            n++;
        }
    }

    function _isLiveStake(uint256 i) private view returns (bool) {
        return stakeIndex[stakes[i].voter] == i + 1;
    }

    function _durationCap(string memory duration) private pure returns (uint256) {
        bytes32 k = keccak256(bytes(duration));
        if (k == keccak256("1w")) return 1;
        if (k == keccak256("1m")) return 2;
        if (k == keccak256("3m")) return 4;
        if (k == keccak256("6m")) return 7;
        if (k == keccak256("1y")) return 12;
        return 0;
    }

    // 1 + months elapsed, capped at the duration's maximum; in thousandths.
    function _strength(Stake memory s) private view returns (uint256) {
        uint256 cap = _durationCap(s.duration) * 1000;
        if (block.timestamp <= s.timestamp) return 1000;
        uint256 strength = 1000 + ((block.timestamp - s.timestamp) * 1000) / MONTH;
        return strength > cap ? cap : strength;
    }
}
