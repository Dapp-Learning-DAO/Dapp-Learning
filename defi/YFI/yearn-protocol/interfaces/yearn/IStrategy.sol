// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

interface IStrategy {
    function want() external view returns (address);

    function deposit() external;

    // NOTE: must exclude any tokens used in the yield
    // Controller role - withdraw should return to Controller
    function withdraw(address) external;

    // Controller | Vault role - withdraw should always return to Vault
    function withdraw(uint256) external;

    function skim() external;

    // Controller | Vault role - withdraw should always return to Vault
    function withdrawAll() external returns (uint256);

    function balanceOf() external view returns (uint256);

    function withdrawalFee() external view returns (uint256);
}
