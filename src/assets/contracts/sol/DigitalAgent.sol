// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// A person's Digital Agent profile. Each person deploys their own, on their
// own node, and makes their copy public so that others can show their name.
contract DigitalAgent {
    struct Profile {
        string displayName;
        string photo;
        string country;
        string[] languages;
        string accountKind;
        uint256 updatedAt;
    }

    address public owner;
    Profile private profile;

    constructor(
        string memory display_name,
        string memory photo,
        string memory country,
        string[] memory languages,
        string memory account_kind
    ) {
        owner = msg.sender;
        _setProfile(display_name, photo, country, languages);
        if (bytes(account_kind).length > 0) _setAccountKind(account_kind);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can change this profile");
        _;
    }

    function set_profile(
        string memory display_name,
        string memory photo,
        string memory country,
        string[] memory languages
    ) external onlyOwner {
        _setProfile(display_name, photo, country, languages);
    }

    function set_account_kind(string memory kind) external onlyOwner {
        _setAccountKind(kind);
    }

    function get_profile() external view returns (Profile memory) {
        return profile;
    }

    function _setProfile(
        string memory display_name,
        string memory photo,
        string memory country,
        string[] memory languages
    ) private {
        profile.displayName = display_name;
        profile.photo = photo;
        profile.country = country;
        profile.languages = languages;
        profile.updatedAt = block.timestamp;
    }

    function _setAccountKind(string memory kind) private {
        bytes32 k = keccak256(bytes(kind));
        require(
            k == keccak256("person") || k == keccak256("organisation") || k == keccak256("contributor"),
            "unknown account kind"
        );
        profile.accountKind = kind;
        profile.updatedAt = block.timestamp;
    }
}
