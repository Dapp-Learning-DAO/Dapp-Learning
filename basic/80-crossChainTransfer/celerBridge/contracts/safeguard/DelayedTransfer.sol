// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "./Governor.sol";

abstract contract DelayedTransfer is Governor {
    struct delayedTransfer {
        address receiver;
        address token;
        uint256 amount;
        uint256 timestamp;
    }
    mapping(bytes32 => delayedTransfer) public delayedTransfers;
    mapping(address => uint256) public delayThresholds;
    uint256 public delayPeriod; // in seconds

    event DelayedTransferAdded(bytes32 id);
    event DelayedTransferExecuted(bytes32 id, address receiver, address token, uint256 amount);

    event DelayPeriodUpdated(uint256 period);
    event DelayThresholdUpdated(address token, uint256 threshold);

    function setDelayThresholds(address[] calldata _tokens, uint256[] calldata _thresholds) external onlyGovernor {
        require(_tokens.length == _thresholds.length, "length mismatch");
        for (uint256 i = 0; i < _tokens.length; i++) {
            delayThresholds[_tokens[i]] = _thresholds[i];
            emit DelayThresholdUpdated(_tokens[i], _thresholds[i]);
        }
    }

    function setDelayPeriod(uint256 _period) external onlyGovernor {
        delayPeriod = _period;
        emit DelayPeriodUpdated(_period);
    }

    function _addDelayedTransfer(
        bytes32 id,
        address receiver,
        address token,
        uint256 amount
    ) internal {
        require(delayedTransfers[id].timestamp == 0, "delayed transfer already exists");
        delayedTransfers[id] = delayedTransfer({
            receiver: receiver,
            token: token,
            amount: amount,
            timestamp: block.timestamp
        });
        emit DelayedTransferAdded(id);
    }

    // caller needs to do the actual token transfer
    function _executeDelayedTransfer(bytes32 id) internal returns (delayedTransfer memory) {
        delayedTransfer memory transfer = delayedTransfers[id];
        require(transfer.timestamp > 0, "delayed transfer not exist");
        require(block.timestamp > transfer.timestamp + delayPeriod, "delayed transfer still locked");
        delete delayedTransfers[id];
        emit DelayedTransferExecuted(id, transfer.receiver, transfer.token, transfer.amount);
        return transfer;
    }
}