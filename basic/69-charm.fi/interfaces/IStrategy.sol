// SPDX-License-Identifier: Unlicense

pragma solidity 0.7.6;

interface IStrategy {
    function rebalance() external;

    function shouldRebalance() external view returns (bool);
}
