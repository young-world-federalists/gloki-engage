// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// The beta's one shared forum: a threaded discussion, deployed by the
// application account and made public; everyone posts as a guest. The same
// discussion functions as an initiative's, and add_comment also records where
// each author's profile is, so the forum can show their name.
contract Forum {
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

    struct Participant {
        address agent;
        string node; // the author's node, where their profile lives
        string profile; // the author's Digital Agent profile contract
    }

    Comment[] private comments; // id = index + 1
    CommentVote[] private commentVotes;
    mapping(bytes32 => uint256) private commentVoteIndex; // 1-based
    Participant[] private participants;
    mapping(address => uint256) private participantIndex; // 1-based

    function approve_guest(address) external pure returns (bool) {
        return true;
    }

    function add_comment(
        string memory text,
        uint256 parent_id,
        string memory category,
        string memory sources,
        string memory node,
        string memory profile
    ) external returns (uint256 id) {
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
        uint256 i = participantIndex[msg.sender];
        if (i == 0) {
            participants.push(Participant(msg.sender, node, profile));
            participantIndex[msg.sender] = participants.length;
        } else {
            participants[i - 1].node = node;
            participants[i - 1].profile = profile;
        }
    }

    function delete_comment(uint256 comment_id) external {
        Comment storage c = _comment(comment_id);
        require(c.author == msg.sender, "Only the author can delete a comment");
        c.deleted = true;
        c.text = "";
    }

    function like_comment(uint256 comment_id) external {
        Comment storage c = _comment(comment_id);
        for (uint256 i = 0; i < c.likes.length; i++) {
            if (c.likes[i] == msg.sender) {
                c.likes[i] = c.likes[c.likes.length - 1];
                c.likes.pop();
                return;
            }
        }
        c.likes.push(msg.sender);
    }

    function get_comments() external view returns (Comment[] memory) {
        return comments;
    }

    // Up/down on root comments only; 'none' removes the caller's vote.
    function vote_comment(uint256 comment_id, string memory direction) external {
        Comment storage c = _comment(comment_id);
        require(c.parentId == 0, "Only a root comment can be voted on");
        require(!c.deleted, "This comment was deleted");
        bytes32 d = keccak256(bytes(direction));
        bool none = d == keccak256("none");
        require(none || d == keccak256("up") || d == keccak256("down"), "Invalid direction");
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

    function get_participants() external view returns (Participant[] memory) {
        return participants;
    }

    function _comment(uint256 id) private view returns (Comment storage) {
        require(id >= 1 && id <= comments.length, "Unknown comment");
        return comments[id - 1];
    }
}
