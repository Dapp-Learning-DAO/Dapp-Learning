// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "./Governor.sol";

abstract contract VolumeControl is Governor {
    uint256 public epochLength; // seconds
    mapping(address => uint256) public epochVolumes; // key is token
    mapping(address => uint256) public epochVolumeCaps; // key is token
    mapping(address => uint256) public lastOpTimestamps; // key is token

    event EpochLengthUpdated(uint256 length);
    event EpochVolumeUpdated(address token, uint256 cap);

    function setEpochLength(uint256 _length) external onlyGovernor {
        epochLength = _length;
        emit EpochLengthUpdated(_length);
    }

    function setEpochVolumeCaps(address[] calldata _tokens, uint256[] calldata _caps) external onlyGovernor {
        require(_tokens.length == _caps.length, "length mismatch");
        for (uint256 i = 0; i < _tokens.length; i++) {
            epochVolumeCaps[_tokens[i]] = _caps[i];
            emit EpochVolumeUpdated(_tokens[i], _caps[i]);
        }
    }

    function _updateVolume(address _token, uint256 _amount) internal {
        if (epochLength == 0) {
            return;
        }
        uint256 cap = epochVolumeCaps[_token];
        if (cap == 0) {
            return;
        }
        uint256 volume = epochVolumes[_token];
        uint256 timestamp = block.timestamp;
        uint256 epochStartTime = (timestamp / epochLength) * epochLength;
        if (lastOpTimestamps[_token] < epochStartTime) {
            volume = _amount;
        } else {
            volume += _amount;
        }
        require(volume <= cap, "volume exceeds cap");
        epochVolumes[_token] = volume;
        lastOpTimestamps[_token] = timestamp;
    }
}