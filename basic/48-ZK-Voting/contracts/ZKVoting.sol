//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import { ProveInTreeVerifier } from "./Verifier.sol";
import {ProveInTreeVerifier} from "./ProveInTreeVerifier.sol";
import {Add2TreeVerifier} from "./Add2TreeVerifier.sol";

contract ZKVoting {
    //event SetPurpose(address sender, string purpose);
    event AddLeaf(uint256 indexed key, uint256 indexed value, uint256 indexed oldRoot);

    event CreateVote(uint256 indexed voteId, uint256 indexed deadline);

    uint256 public voteNonce;

    uint256 public root;
    uint256[] public leafValues;
    uint256 public nextKey;

    Add2TreeVerifier public add2TreeVerifier;
    ProveInTreeVerifier public proveInTreeVerifier;

    mapping(uint256 => bool) public voteLogged;
    mapping(uint256 => int256) public voteResult;
    mapping(uint256 => uint256) public voteDeadline;

    constructor(uint256 root_) {
        root = root_;
        add2TreeVerifier = new Add2TreeVerifier();
        proveInTreeVerifier = new ProveInTreeVerifier();
    }

    function createVote(uint256 deadline) external {
        require(deadline > block.timestamp, "createVote: Invalid Deadline");

        uint256 voteId = voteNonce;
        voteNonce++;
        voteDeadline[voteId] = deadline;

        emit CreateVote(voteId, deadline);
    }

    function addLeaf(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[6] memory input)
        external
    {
        require(input[1] == root, "addLeaf: Invalid Root");
        require(input[2] == nextKey, "addLeaf: Invalid Key");

        // add membership requirements here

        require(verifyAdd2TreeProof(a, b, c, input) == true, "addLeaf: Invalid Proof");

        leafValues.push(input[3]);
        nextKey = leafValues.length;
        root = input[0];

        emit AddLeaf(input[2], input[3], input[1]);
    }

    function proveAndVote(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input,
        bool slant
    ) external returns (bool r) {
        require(voteLogged[input[0]] != true, "proveAndVote: Vote Logged");
        require(voteDeadline[input[2]] > block.timestamp, "proveAndVote: Deadline Passed");
        require(input[1] == root, "proveAndVote: Invalid Root");

        r = verifyProveInTreeProof(a, b, c, input);
        require(r == true, "proveAndVote: Invalid Proof");

        voteLogged[input[0]] = true;
        if (slant == true) {
            voteResult[input[2]] += 1;
        } else {
            voteResult[input[2]] -= 1;
        }
    }

    function verifyAdd2TreeProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[6] memory input
    ) public view returns (bool) {
        return add2TreeVerifier.verifyProof(a, b, c, input);
    }

    function verifyProveInTreeProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) public view returns (bool) {
        return proveInTreeVerifier.verifyProof(a, b, c, input);
    }
}
