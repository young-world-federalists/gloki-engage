// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Application-wide settings, deployed once by the central application account
// and made public. It records where the verification contract lives, and which
// agents host it: the verification contract is deployed by the first person to
// get verified, on their own agent, who joins this contract as a guest to
// publish where it is. And it records the forum, which the application
// account deploys itself.
contract ApplicationSettings {
    struct Host {
        string server;
        address agent;
    }

    address public owner;
    string private verification;
    uint256 private since;
    Host[] private hosts;
    mapping(address => uint256) private hostIndex; // 1-based into hosts
    string private forum;

    constructor() {
        owner = msg.sender;
    }

    function approve_guest(address) external pure returns (bool) {
        return true;
    }

    // The first call fixes the contract id; a different id later is refused.
    // An agent records only its own host entry.
    function register_verification(string memory server, string memory contract_id) external {
        require(bytes(server).length > 0 && bytes(contract_id).length > 0, "server and contract are required");
        if (bytes(verification).length == 0) {
            verification = contract_id;
            since = block.timestamp;
        } else {
            require(keccak256(bytes(verification)) == keccak256(bytes(contract_id)), "Verification has already started");
        }
        uint256 i = hostIndex[msg.sender];
        if (i == 0) {
            hosts.push(Host(server, msg.sender));
            hostIndex[msg.sender] = hosts.length;
        } else {
            hosts[i - 1].server = server;
        }
    }

    // The operator's way out if someone registered a wrong contract first.
    function reset_verification() external {
        require(msg.sender == owner, "Only the application account can reset verification");
        for (uint256 i = 0; i < hosts.length; i++) delete hostIndex[hosts[i].agent];
        delete hosts;
        delete verification;
        delete since;
    }

    function set_forum(string memory contract_id) external {
        require(msg.sender == owner, "Only the application account can set the forum");
        forum = contract_id;
    }

    function get_forum() external view returns (string memory) {
        return forum;
    }

    function get_verification() external view returns (string memory contract_id, Host[] memory verification_hosts) {
        return (verification, hosts);
    }
}
