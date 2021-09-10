// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

interface IStakingPools  {
  function deposit(uint256 _poolId, uint256 _depositAmount) external;
  function withdraw(uint256 _poolId, uint256 _withdrawAmount) external;
  function claim(uint256 _poolId) external;
}

