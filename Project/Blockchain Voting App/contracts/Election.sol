// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Election {
    address public owner;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Winner {
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;
    mapping(address => bool) public voters;
    bool public resultsDeclared;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        resultsDeclared = false;
    }

    function addCandidate(string memory _name) public onlyOwner {
        require(!resultsDeclared, "Cannot add candidates after results are declared.");
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(uint _candidateId) public {
        require(!voters[msg.sender], "You have already voted");
        require(!resultsDeclared, "Election has ended");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
    }

    function declareResults() public onlyOwner {
        resultsDeclared = true;
    }

    function getWinner() public view returns (Winner memory) {
        require(resultsDeclared, "Results have not been declared yet.");
        
        uint maxVotes = 0;
        uint winningCandidateId = 0;

        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winningCandidateId = i;
            }
        }
        
        // Note: This simple implementation doesn't handle ties.
        // It will return the first candidate with the highest vote count.
        if (winningCandidateId > 0) {
            return Winner(candidates[winningCandidateId].name, candidates[winningCandidateId].voteCount);
        } else {
            return Winner("No Winner", 0);
        }
    }

    function resetElection() public onlyOwner {
        resultsDeclared = false;
        // This loop is more explicit for deleting mappings but is gas-intensive.
        // For this project's scale, it's acceptable.
        for (uint i = 1; i <= candidatesCount; i++) {
            delete candidates[i];
        }
        candidatesCount = 0;
        // Resetting voters would require iterating through all addresses, which is not feasible.
        // A new contract deployment is the cleanest way to reset voters.
    }
}