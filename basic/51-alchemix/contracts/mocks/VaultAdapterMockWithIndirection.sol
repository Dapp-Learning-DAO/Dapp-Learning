// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "../interfaces/IVaultAdapter.sol";

contract VaultAdapterMockWithIndirection is IVaultAdapter {
  using SafeERC20 for IDetailedERC20;

  IDetailedERC20 private _token;

  constructor(IDetailedERC20 token_) public {
    _token = token_;
  }

  function token() external view override returns (IDetailedERC20) {
    return _token;
  }

  function totalValue() external view override returns (uint256) {
    return _token.balanceOf(address(this));
  }

  function deposit(uint256 _amount) external override { }

  function withdraw(address _recipient, uint256 _amount) external override {
    _token.safeTransfer(_recipient, _amount);
  }

  function indirectWithdraw(address _recipient, uint256 _amount) external {
    _token.safeTransfer(_recipient, _amount);
  }
}
