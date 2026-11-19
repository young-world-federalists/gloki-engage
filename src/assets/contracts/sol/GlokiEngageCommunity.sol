// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// A gloki-engage community: its details, its members and the references to
// its initiatives. Membership is this contract's own list, separate from the
// contract's partners: a member joins (as a partner or as a guest) and then
// enrolls. An initiative lives on its creator's node; the community keeps
// only where to find it.
contract GlokiEngageCommunity {
    struct Details {
        string name;
        string description;
        address createdBy;
        uint256 createdAt;
    }

    struct Member {
        address agent;
        string node; // the member's node, where their profile lives
        string profile; // the member's Digital Agent profile contract
        uint256 at;
    }

    struct InitiativeRef {
        string node; // the creator's node
        address agent; // the creator
        string contract_id;
        uint256 at;
    }

    Details private details;
    Member[] private members;
    mapping(address => uint256) private memberIndex; // 1-based
    InitiativeRef[] private initiatives;

    constructor(string memory name, string memory description, string memory node, string memory profile) {
        details = Details(name, description, msg.sender, block.timestamp);
        _enroll(msg.sender, node, profile);
    }

    function approve_guest(address) external pure returns (bool) {
        return true;
    }

    function get_details() external view returns (Details memory) {
        return details;
    }

    function set_details(string memory name, string memory description) external {
        require(msg.sender == details.createdBy, "Only the founder can edit the community");
        details.name = name;
        details.description = description;
    }

    // ─── Members ────────────────────────────────────────────────────────────

    function enroll(string memory node, string memory profile) external {
        _enroll(msg.sender, node, profile);
    }

    function get_members() external view returns (Member[] memory) {
        return members;
    }

    function is_member(address agent) external view returns (bool) {
        return memberIndex[agent] != 0;
    }

    // ─── Initiatives ────────────────────────────────────────────────────────

    function add_initiative(string memory node, string memory contract_id) external {
        require(memberIndex[msg.sender] != 0, "Only members can add an initiative");
        initiatives.push(InitiativeRef(node, msg.sender, contract_id, block.timestamp));
    }

    function get_initiatives() external view returns (InitiativeRef[] memory) {
        return initiatives;
    }

    function _enroll(address agent, string memory node, string memory profile) private {
        uint256 i = memberIndex[agent];
        if (i == 0) {
            members.push(Member(agent, node, profile, block.timestamp));
            memberIndex[agent] = members.length;
        } else {
            members[i - 1].node = node;
            members[i - 1].profile = profile;
        }
    }
}
