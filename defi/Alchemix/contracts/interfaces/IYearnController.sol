// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

interface IYearnController {
  function balanceOf(address _token) external view returns (uint256);
  function earn(address _token, uint256 _amount) external;
  function withdraw(address _token, uint256 _withdrawAmount) external;
}