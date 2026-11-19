// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// The one app-wide verification contract: the single source of truth for who
// is verified. Deployed by the first person to get verified (the founder),
// who becomes its steward. Everyone else uses it as a guest; its copy is
// public, so anyone can read the list. Every action is the signer's own
// (msg.sender).
//
// Three phases, by how many people are verified (V):
//   V == 1..3  sequential  one candidate at a time; every verified person
//                          must vouch before register() accepts them.
//   V >= 4     open        any requester; four vouches from verified people.
contract GlokiVerification {
    uint256 private constant OPEN_THRESHOLD = 4;

    struct Verified {
        address key;
        uint256 at;
        string method; // founder | sequential | vouches
        address[] vouchers;
        string node;
        string profile;
    }

    struct Request {
        address requester;
        address approver;
        string node;
        string profile;
        uint256 at;
        string status; // pending | approved | declined
    }

    struct Vouch {
        address voucher;
        address requester;
        uint256 at;
    }

    struct Status {
        address steward;
        Verified[] verified;
        address candidate;
        uint256 candidateSince;
        Request[] requests;
        Vouch[] vouches;
    }

    address public steward;
    address private candidate;
    uint256 private candidateSince;

    address[] private verifiedKeys;
    mapping(address => Verified) private verified;
    mapping(address => bool) private isVerified;

    Request[] private requests;
    mapping(bytes32 => uint256) private requestIndex; // 1-based; 0 = none or dropped
    Vouch[] private vouches;
    mapping(bytes32 => uint256) private vouchIndex; // 1-based; 0 = none or dropped

    constructor(string memory node, string memory profile) {
        steward = msg.sender;
        _addVerified(msg.sender, "founder", new address[](0), node, profile);
    }

    function approve_guest(address) external pure returns (bool) {
        return true;
    }

    // ─── Reads ──────────────────────────────────────────────────────────────

    function get_status() external view returns (Status memory status) {
        status.steward = steward;
        status.candidate = candidate;
        status.candidateSince = candidateSince;
        status.verified = new Verified[](verifiedKeys.length);
        for (uint256 i = 0; i < verifiedKeys.length; i++) status.verified[i] = verified[verifiedKeys[i]];
        status.requests = _liveRequests();
        status.vouches = _liveVouches();
    }

    // ─── Requests and vouches ───────────────────────────────────────────────

    function request_vouch(address approver, string memory node, string memory profile) external {
        address requester = msg.sender;
        require(requester != approver, "Invalid request");
        require(!isVerified[requester], "You are already verified");
        require(isVerified[approver], "Only verified people can vouch");
        if (_isSequential()) {
            require(candidate == address(0) || candidate == requester, "Someone else is being verified right now");
            if (candidate == address(0)) {
                candidate = requester;
                candidateSince = block.timestamp;
            }
        }
        bytes32 key = _pair(requester, approver);
        uint256 i = requestIndex[key];
        if (i != 0) {
            Request storage r = requests[i - 1];
            if (_eq(r.status, "approved")) return;
            r.node = node;
            r.profile = profile;
            r.at = block.timestamp;
            r.status = "pending";
        } else {
            requests.push(Request(requester, approver, node, profile, block.timestamp, "pending"));
            requestIndex[key] = requests.length;
        }
    }

    function vouch(address requester) external {
        address voucher = msg.sender;
        require(isVerified[voucher], "Only verified people can vouch");
        require(!isVerified[requester], "Already verified");
        uint256 i = requestIndex[_pair(requester, voucher)];
        require(i != 0, "No request from this person");
        requests[i - 1].status = "approved";
        bytes32 key = _pair(voucher, requester);
        if (vouchIndex[key] == 0) {
            vouches.push(Vouch(voucher, requester, block.timestamp));
            vouchIndex[key] = vouches.length;
        } else {
            vouches[vouchIndex[key] - 1].at = block.timestamp;
        }
    }

    function decline_vouch(address requester) external {
        uint256 i = requestIndex[_pair(requester, msg.sender)];
        require(i != 0, "No request from this person");
        require(_eq(requests[i - 1].status, "pending"), "This request is already settled");
        requests[i - 1].status = "declined";
    }

    // ─── Registration: the only way onto the verified list after the founder ─

    function register(address[] memory vouchers, string memory node, string memory profile) external {
        address newcomer = msg.sender;
        require(!isVerified[newcomer], "You are already verified");
        for (uint256 i = 0; i < vouchers.length; i++) {
            for (uint256 j = 0; j < i; j++) require(vouchers[j] != vouchers[i], "Each voucher may be listed once");
            require(isVerified[vouchers[i]], "Every voucher must be verified");
            require(vouchIndex[_pair(vouchers[i], newcomer)] != 0, "A listed voucher has not vouched for you");
        }
        bool sequential = _isSequential();
        if (sequential) {
            require(candidate == newcomer, "Someone else is being verified right now");
            require(vouchers.length == verifiedKeys.length, "Every verified person must vouch");
        } else {
            require(vouchers.length >= OPEN_THRESHOLD, "Four vouches are needed");
        }
        _addVerified(newcomer, sequential ? "sequential" : "vouches", vouchers, node, profile);
        if (sequential) {
            candidate = address(0);
            candidateSince = 0;
        }
        _dropRequester(newcomer);
    }

    // ─── Steward ────────────────────────────────────────────────────────────

    function reset_candidate() external {
        require(msg.sender == steward, "Only the steward can reset the candidate");
        address current = candidate;
        candidate = address(0);
        candidateSince = 0;
        if (current != address(0)) _dropRequester(current);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    function _isSequential() private view returns (bool) {
        return verifiedKeys.length < OPEN_THRESHOLD;
    }

    function _addVerified(
        address key,
        string memory method,
        address[] memory vouchers,
        string memory node,
        string memory profile
    ) private {
        verified[key] = Verified(key, block.timestamp, method, vouchers, node, profile);
        isVerified[key] = true;
        verifiedKeys.push(key);
    }

    // Drops every request from, and every vouch for, `requester`.
    function _dropRequester(address requester) private {
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i].requester == requester) delete requestIndex[_pair(requester, requests[i].approver)];
        }
        for (uint256 i = 0; i < vouches.length; i++) {
            if (vouches[i].requester == requester) delete vouchIndex[_pair(vouches[i].voucher, requester)];
        }
    }

    function _liveRequests() private view returns (Request[] memory out) {
        uint256 n = 0;
        for (uint256 i = 0; i < requests.length; i++) if (_isLiveRequest(i)) n++;
        out = new Request[](n);
        n = 0;
        for (uint256 i = 0; i < requests.length; i++) if (_isLiveRequest(i)) out[n++] = requests[i];
    }

    function _liveVouches() private view returns (Vouch[] memory out) {
        uint256 n = 0;
        for (uint256 i = 0; i < vouches.length; i++) if (_isLiveVouch(i)) n++;
        out = new Vouch[](n);
        n = 0;
        for (uint256 i = 0; i < vouches.length; i++) if (_isLiveVouch(i)) out[n++] = vouches[i];
    }

    function _isLiveRequest(uint256 i) private view returns (bool) {
        return requestIndex[_pair(requests[i].requester, requests[i].approver)] == i + 1;
    }

    function _isLiveVouch(uint256 i) private view returns (bool) {
        return vouchIndex[_pair(vouches[i].voucher, vouches[i].requester)] == i + 1;
    }

    function _pair(address a, address b) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(a, b));
    }

    function _eq(string memory a, string memory b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
