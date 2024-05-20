// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import {IScaledBalanceToken} from './IScaledBalanceToken.sol';
import {IInitializableDebtToken} from './IInitializableDebtToken.sol';

/**
 * @title IVariableDebtToken
 * @author Aave
 * @notice Defines the basic interface for a variable debt token.
 */
interface IVariableDebtToken is IScaledBalanceToken, IInitializableDebtToken {
  /**
   * @notice Mints debt token to the `onBehalfOf` address
   * @param user The address receiving the borrowed underlying, being the delegatee in case
   * of credit delegate, or same as `onBehalfOf` otherwise
   * @param onBehalfOf The address receiving the debt tokens
   * @param amount The amount of debt being minted
   * @param index The variable debt index of the reserve
   * @return True if the previous balance of the user is 0, false otherwise
   * @return The scaled total debt of the reserve
   */
  function mint(
    address user,
    address onBehalfOf,
    uint256 amount,
    uint256 index
  ) external returns (bool, uint256);

  /**
   * @notice Burns user variable debt
   * @dev In some instances, a burn transaction will emit a mint event
   * if the amount to burn is less than the interest that the user accrued
   * @param from The address from which the debt will be burned
   * @param amount The amount getting burned
   * @param index The variable debt index of the reserve
   * @return The scaled total debt of the reserve
   */
  function burn(address from, uint256 amount, uint256 index) external returns (uint256);

  /**
   * @notice Returns the address of the underlying asset of this debtToken (E.g. WETH for variableDebtWETH)
   * @return The address of the underlying asset
   */
  function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
