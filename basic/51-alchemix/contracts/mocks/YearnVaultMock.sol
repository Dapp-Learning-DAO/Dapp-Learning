// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../interfaces/IYearnController.sol";
import "../interfaces/IYearnVault.sol";

contract YearnVaultMock is  ERC20 {
  using SafeERC20 for IDetailedERC20;
  using SafeMath for uint256;

  uint256 public min = 9500;
  uint256 public constant max = 10000;

  IYearnController public controller;
  IDetailedERC20 public token;

  constructor(IDetailedERC20 _token, IYearnController _controller) public ERC20("yEarn Mock", "yMOCK") {
    token = _token;
    controller = _controller;
  }

  function vdecimals() external view returns (uint8) {
    return decimals();
  }

  function balance() public view  returns (uint256) {
    return token.balanceOf(address(this)).add(controller.balanceOf(address(token)));
  }

  function available() public view  returns (uint256) {
    return token.balanceOf(address(this)).mul(min).div(max);
  }

  function earn() external  {
    uint _bal = available();
    token.safeTransfer(address(controller), _bal);
    controller.earn(address(token), _bal);
  }

  function deposit(uint256 _amount) external returns (uint){
    uint _pool = balance();
    uint _before = token.balanceOf(address(this));
    token.safeTransferFrom(msg.sender, address(this), _amount);
    uint _after = token.balanceOf(address(this));
    _amount = _after.sub(_before); // Additional check for deflationary tokens
    uint _shares = 0;
    if (totalSupply() == 0) {
      _shares = _amount;
    } else {
      _shares = (_amount.mul(totalSupply())).div(_pool);
    }
    _mint(msg.sender, _shares);
  }

  function withdraw(uint _shares, address _recipient) external returns (uint) {
    uint _r = (balance().mul(_shares)).div(totalSupply());
    _burn(msg.sender, _shares);

    // Check balance
    uint _b = token.balanceOf(address(this));
    if (_b < _r) {
      uint _withdraw = _r.sub(_b);
      controller.withdraw(address(token), _withdraw);
      uint _after = token.balanceOf(address(this));
      uint _diff = _after.sub(_b);
      if (_diff < _withdraw) {
        _r = _b.add(_diff);
      }
    }

    token.safeTransfer(_recipient, _r);
  }

  function pricePerShare() external view returns (uint256) {
    return balance().mul(1e18).div(totalSupply());
  }// changed to v2

  /// @dev This is not part of the vault contract and is meant for quick debugging contracts to have control over
  /// completely clearing the vault buffer to test certain behaviors better.
  function clear() external {
    token.safeTransfer(address(controller), token.balanceOf(address(this)));
    controller.earn(address(token), token.balanceOf(address(this)));
  }
}