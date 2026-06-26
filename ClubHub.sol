// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ClubHub
 * @dev A smart contract to create and join multiple student clubs for the Avalanche Hackathon.
 */
contract ClubHub {
    uint256 public nextClubId = 1;

    struct Club {
        uint256 id;
        string name;
        address creator;
        uint256 memberCount;
    }

    // Stores all clubs by ID
    mapping(uint256 => Club) public clubs;
    // Checks if an address is a member of a specific club ID
    mapping(uint256 => mapping(address => bool)) public isMember;
    // Keeps track of all club IDs a user has joined
    mapping(address => uint256[]) public userClubs;

    event ClubCreated(uint256 indexed clubId, string name, address indexed creator);
    event MemberJoined(uint256 indexed clubId, address indexed memberAddress);

    /**
     * @dev Create a new club
     */
    function createClub(string memory _name) public returns (uint256) {
        uint256 clubId = nextClubId++;
        clubs[clubId] = Club({
            id: clubId,
            name: _name,
            creator: msg.sender,
            memberCount: 0
        });
        
        emit ClubCreated(clubId, _name, msg.sender);
        
        // Auto-join the creator to their own club
        _joinClub(clubId, msg.sender);
        
        return clubId;
    }

    /**
     * @dev Join an existing club by its ID
     */
    function joinClub(uint256 _clubId) public {
        require(_clubId < nextClubId && _clubId > 0, "Club does not exist");
        require(!isMember[_clubId][msg.sender], "You are already a member of this club");
        
        _joinClub(_clubId, msg.sender);
    }

    function _joinClub(uint256 _clubId, address _member) internal {
        isMember[_clubId][_member] = true;
        clubs[_clubId].memberCount++;
        userClubs[_member].push(_clubId);
        
        emit MemberJoined(_clubId, _member);
    }

    /**
     * @dev Get all club IDs that a user belongs to
     */
    function getUserClubs(address _user) public view returns (uint256[] memory) {
        return userClubs[_user];
    }
}
