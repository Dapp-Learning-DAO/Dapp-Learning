pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./MerkleProof.sol";
import "./IMerkleDistributor.sol";

contract MerkleDistributor is IMerkleDistributor {
    address public immutable override token;
    bytes32 public immutable override merkleRoot;
    address public owner;
    uint256 public expire_time;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    constructor(address token_, bytes32 merkleRoot_, uint _duration, address _owner) public {
        owner = _owner;
        token = token_;
        merkleRoot = merkleRoot_;
        expire_time = block.timestamp + _duration;
    }

    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }

    function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external override {
        require (expire_time > block.timestamp, "Expired");
        require(!isClaimed(index), 'MerkleDistributor: Drop already claimed.');


        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), 'MerkleDistributor: Invalid proof.');

        // Mark it claimed and send the token.
        _setClaimed(index);
        require(IERC20(token).transfer(account, amount), 'MerkleDistributor: Transfer failed.');

        emit Claimed(index, account, amount);
    }

     /// @notice  owner withdraw the rest token
    function claimRestTokens(address to ) public returns (bool) {
        // only owner
        require (expire_time < block.timestamp, "Not expired yet");
        require(msg.sender == owner);
        require(IERC20(token).balanceOf(address(this)) >= 0);
        require(IERC20(token).transfer(to, IERC20(token).balanceOf(address(this))));
        return true;
    }
}