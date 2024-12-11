// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IVault {
    function deposit() external payable;
    function withdraw() external;
}
