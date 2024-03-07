// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./safeguard/Ownable.sol";
import "./interfaces/ISigsVerifier.sol";

/**
 * @title Multi-sig verification and management functions for {Bridge}.
 */
contract Signers is Ownable, ISigsVerifier {
    using ECDSA for bytes32;

    bytes32 public ssHash;
    uint256 public triggerTime; // timestamp when last update was triggered

    // reset can be called by the owner address for emergency recovery
    uint256 public resetTime;
    uint256 public noticePeriod; // advance notice period as seconds for reset
    uint256 constant MAX_INT = 2**256 - 1;

    event SignersUpdated(address[] _signers, uint256[] _powers);

    event ResetNotification(uint256 resetTime);

    /**
     * @notice Verifies that a message is signed by a quorum among the signers
     * The sigs must be sorted by signer addresses in ascending order.
     * @param _msg signed message
     * @param _sigs list of signatures sorted by signer addresses in ascending order
     * @param _signers sorted list of current signers
     * @param _powers powers of current signers
     */
    function verifySigs(
        bytes memory _msg,
        bytes[] calldata _sigs,
        address[] calldata _signers,
        uint256[] calldata _powers
    ) public view override {
        bytes32 h = keccak256(abi.encodePacked(_signers, _powers));
        require(ssHash == h, "Mismatch current signers");
        _verifySignedPowers(keccak256(_msg).toEthSignedMessageHash(), _sigs, _signers, _powers);
    }

    /**
     * @notice Update new signers.
     * @param _newSigners sorted list of new signers
     * @param _curPowers powers of new signers
     * @param _sigs list of signatures sorted by signer addresses in ascending order
     * @param _curSigners sorted list of current signers
     * @param _curPowers powers of current signers
     */
    function updateSigners(
        uint256 _triggerTime,
        address[] calldata _newSigners,
        uint256[] calldata _newPowers,
        bytes[] calldata _sigs,
        address[] calldata _curSigners,
        uint256[] calldata _curPowers
    ) external {
        // use trigger time for nonce protection, must be ascending
        require(_triggerTime > triggerTime, "Trigger time is not increasing");
        // make sure triggerTime is not too large, as it cannot be decreased once set
        require(_triggerTime < block.timestamp + 3600, "Trigger time is too large");
        bytes32 domain = keccak256(abi.encodePacked(block.chainid, address(this), "UpdateSigners"));
        verifySigs(abi.encodePacked(domain, _triggerTime, _newSigners, _newPowers), _sigs, _curSigners, _curPowers);
        _updateSigners(_newSigners, _newPowers);
        triggerTime = _triggerTime;
    }

    /**
     * @notice reset signers, only used for init setup and emergency recovery
     */
    function resetSigners(address[] calldata _signers, uint256[] calldata _powers) external onlyOwner {
        require(block.timestamp > resetTime, "not reach reset time");
        resetTime = MAX_INT;
        _updateSigners(_signers, _powers);
    }

    function notifyResetSigners() external onlyOwner {
        resetTime = block.timestamp + noticePeriod;
        emit ResetNotification(resetTime);
    }

    function increaseNoticePeriod(uint256 period) external onlyOwner {
        require(period > noticePeriod, "notice period can only be increased");
        noticePeriod = period;
    }

    // separate from verifySigs func to avoid "stack too deep" issue
    function _verifySignedPowers(
        bytes32 _hash,
        bytes[] calldata _sigs,
        address[] calldata _signers,
        uint256[] calldata _powers
    ) private pure {
        require(_signers.length == _powers.length, "signers and powers length not match");
        uint256 totalPower; // sum of all signer.power
        for (uint256 i = 0; i < _signers.length; i++) {
            totalPower += _powers[i];
        }
        uint256 quorum = (totalPower * 2) / 3 + 1;

        uint256 signedPower; // sum of signer powers who are in sigs
        address prev = address(0);
        uint256 index = 0;
        for (uint256 i = 0; i < _sigs.length; i++) {
            address signer = _hash.recover(_sigs[i]);
            require(signer > prev, "signers not in ascending order");
            prev = signer;
            // now find match signer add its power
            while (signer > _signers[index]) {
                index += 1;
                require(index < _signers.length, "signer not found");
            }
            if (signer == _signers[index]) {
                signedPower += _powers[index];
            }
            if (signedPower >= quorum) {
                // return early to save gas
                return;
            }
        }
        revert("quorum not reached");
    }

    function _updateSigners(address[] calldata _signers, uint256[] calldata _powers) private {
        require(_signers.length == _powers.length, "signers and powers length not match");
        address prev = address(0);
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] > prev, "New signers not in ascending order");
            prev = _signers[i];
        }
        ssHash = keccak256(abi.encodePacked(_signers, _powers));
        emit SignersUpdated(_signers, _powers);
    }
}