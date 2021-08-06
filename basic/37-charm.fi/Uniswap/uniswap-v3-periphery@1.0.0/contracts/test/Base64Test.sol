// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;

import 'base64-sol/base64.sol';

contract Base64Test {
    function encode(bytes memory data) external pure returns (string memory) {
        return Base64.encode(data);
    }

    function getGasCostOfEncode(bytes memory data) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        Base64.encode(data);
        return gasBefore - gasleft();
    }
}
