// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

import "../interfaces/IYearnController.sol";

contract YearnControllerMock is IYearnController {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  address constant public blackhole = 0x000000000000000000000000000000000000dEaD;

  uint256 public withdrawalFee = 50;
  uint256 constant public withdrawalMax = 10000;

  function setWithdrawalFee(uint256 _withdrawalFee) external {
    withdrawalFee = _withdrawalFee;
  }

  function balanceOf(address _token) external view override returns (uint256) {
    return IERC20(_token).balanceOf(address(this));
  }

  function earn(address _token, uint256 _amount) external override { }

  function withdraw(address _token, uint256 _amount) external override {
    uint _balance = IERC20(_token).balanceOf(address(this));
    // uint _fee = _amount.mul(withdrawalFee).div(withdrawalMax);

    // IERC20(_token).safeTransfer(blackhole, _fee);
    IERC20(_token).safeTransfer(msg.sender, _amount);
  }
}