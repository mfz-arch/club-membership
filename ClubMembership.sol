// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ClubMembership
 * @dev A simple smart contract to record student club memberships for the Avalanche Hackathon.
 */
contract ClubMembership {
    
    // Array to store all the wallet addresses of members
    address[] public members;
    
    // A mapping to quickly check if an address is already a member
    mapping(address => bool) public isMember;

    // Event to emit when a new member joins (useful for frontends to listen to)
    event MemberJoined(address indexed memberAddress, uint256 timestamp);

    /**
     * @dev Allows any user to join the club by calling this function.
     * It adds their wallet address to the on-chain roster.
     */
    function joinClub() public {
        require(!isMember[msg.sender], "You are already a member of this club!");
        
        // Add member
        members.push(msg.sender);
        isMember[msg.sender] = true;
        
        // Emit event
        emit MemberJoined(msg.sender, block.timestamp);
    }

    /**
     * @dev Returns the total number of members in the club.
     */
    function getMemberCount() public view returns (uint256) {
        return members.length;
    }

    /**
     * @dev Returns the entire list of member addresses.
     */
    function getAllMembers() public view returns (address[] memory) {
        return members;
    }
}
