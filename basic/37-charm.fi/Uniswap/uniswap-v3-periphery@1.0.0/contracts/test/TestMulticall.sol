// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import '../base/Multicall.sol';

contract TestMulticall is Multicall {
    function functionThatRevertsWithError(string memory error) external pure {
        revert(error);
    }

    struct Tuple {
        uint256 a;
        uint256 b;
    }

    function functionThatReturnsTuple(uint256 a, uint256 b) external pure returns (Tuple memory tuple) {
        tuple = Tuple({b: a, a: b});
    }

    uint256 public paid;

    function pays() external payable {
        paid += msg.value;
    }

    function returnSender() external view returns (address) {
        return msg.sender;
    }
}
