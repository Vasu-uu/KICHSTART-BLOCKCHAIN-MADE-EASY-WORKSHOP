// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;
    mapping(address => bool) public voters;

    enum State { NotStarted, Running, Ended }
    State public electionState;

    event Voted(uint indexed candidateId, address indexed voter);
    event CandidateAdded(uint indexed candidateId, string name);
    event ElectionStateChanged(State newState);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    constructor() {
        owner = msg.sender;
        electionState = State.NotStarted;
    }

    function addCandidate(string memory _name) external onlyOwner {
        require(electionState == State.NotStarted, "Cannot add candidates after the election has started.");
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function startVoting() external onlyOwner {
        require(electionState == State.NotStarted, "Election has already been started or ended.");
        electionState = State.Running;
        emit ElectionStateChanged(State.Running);
    }

    function endVoting() external onlyOwner {
        require(electionState == State.Running, "Voting is not currently active.");
        electionState = State.Ended;
        emit ElectionStateChanged(State.Ended);
    }

    function vote(uint _candidateId) external {
        require(electionState == State.Running, "Voting is not active at this moment.");
        require(!voters[msg.sender], "You have already cast your vote.");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID.");

        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(_candidateId, msg.sender);
    }

    function resetElection() external onlyOwner {
        for (uint i = 1; i <= candidatesCount; i++) {
            delete candidates[i];
        }
        candidatesCount = 0;
        electionState = State.NotStarted;
        emit ElectionStateChanged(State.NotStarted);
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidatesCount);
        for (uint i = 0; i < candidatesCount; i++) {
            allCandidates[i] = candidates[i + 1];
        }
        return allCandidates;
    }

    function getWinnerName() public view returns (string memory) {
        require(electionState == State.Ended, "Election has not ended yet.");
        
        uint maxVotes = 0;
        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
            }
        }

        if (maxVotes == 0) {
            return "No votes were cast.";
        }

        string[] memory winners = new string[](candidatesCount);
        uint winnerCount = 0;
        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount == maxVotes) {
                winners[winnerCount] = candidates[i].name;
                winnerCount++;
            }
        }

        if (winnerCount == 1) {
            return winners[0];
        } else {
            string memory tiedWinners = winners[0];
            for(uint i = 1; i < winnerCount; i++){
                tiedWinners = string.concat(tiedWinners, " & ", winners[i]);
            }
            return tiedWinners;
        }
    }
}
