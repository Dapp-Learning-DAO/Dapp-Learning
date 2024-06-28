// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import {IInitializableDebtToken} from './IInitializableDebtToken.sol';

/**
 * @title IStableDebtToken
 * @author Aave
 * @notice Defines the interface for the stable debt token
 * @dev It does not inherit from IERC20 to save in code size
 */
interface IStableDebtToken is IInitializableDebtToken {
  /**
   * @dev Emitted when new stable debt is minted
   * @param user The address of the user who triggered the minting
   * @param onBehalfOf The recipient of stable debt tokens
   * @param amount The amount minted (user entered amount + balance increase from interest)
   * @param currentBalance The balance of the user based on the previous balance and balance increase from interest
   * @param balanceIncrease The increase in balance since the last action of the user 'onBehalfOf'
   * @param newRate The rate of the debt after the minting
   * @param avgStableRate The next average stable rate after the minting
   * @param newTotalSupply The next total supply of the stable debt token after the action
   */
  event Mint(
    address indexed user,
    address indexed onBehalfOf,
    uint256 amount,
    uint256 currentBalance,
    uint256 balanceIncrease,
    uint256 newRate,
    uint256 avgStableRate,
    uint256 newTotalSupply
  );

  /**
   * @dev Emitted when new stable debt is burned
   * @param from The address from which the debt will be burned
   * @param amount The amount being burned (user entered amount - balance increase from interest)
   * @param currentBalance The balance of the user based on the previous balance and balance increase from interest
   * @param balanceIncrease The increase in balance since the last action of 'from'
   * @param avgStableRate The next average stable rate after the burning
   * @param newTotalSupply The next total supply of the stable debt token after the action
   */
  event Burn(
    address indexed from,
    uint256 amount,
    uint256 currentBalance,
    uint256 balanceIncrease,
    uint256 avgStableRate,
    uint256 newTotalSupply
  );

  /**
   * @notice Mints debt token to the `onBehalfOf` address.
   * @dev The resulting rate is the weighted average between the rate of the new debt
   * and the rate of the previous debt
   * @param user The address receiving the borrowed underlying, being the delegatee in case
   * of credit delegate, or same as `onBehalfOf` otherwise
   * @param onBehalfOf The address receiving the debt tokens
   * @param amount The amount of debt tokens to mint
   * @param rate The rate of the debt being minted
   * @return True if it is the first borrow, false otherwise
   * @return The total stable debt
   * @return The average stable borrow rate
   */
  function mint(
    address user,
    address onBehalfOf,
    uint256 amount,
    uint256 rate
  ) external returns (bool, uint256, uint256);

  /**
   * @notice Burns debt of `user`
   * @dev The resulting rate is the weighted average between the rate of the new debt
   * and the rate of the previous debt
   * @dev In some instances, a burn transaction will emit a mint event
   * if the amount to burn is less than the interest the user earned
   * @param from The address from which the debt will be burned
   * @param amount The amount of debt tokens getting burned
   * @return The total stable debt
   * @return The average stable borrow rate
   */
  function burn(address from, uint256 amount) external returns (uint256, uint256);

  /**
   * @notice Returns the average rate of all the stable rate loans.
   * @return The average stable rate
   */
  function getAverageStableRate() external view returns (uint256);

  /**
   * @notice Returns the stable rate of the user debt
   * @param user The address of the user
   * @return The stable rate of the user
   */
  function getUserStableRate(address user) external view returns (uint256);

  /**
   * @notice Returns the timestamp of the last update of the user
   * @param user The address of the user
   * @return The timestamp
   */
  function getUserLastUpdated(address user) external view returns (uint40);

  /**
   * @notice Returns the principal, the total supply, the average stable rate and the timestamp for the last update
   * @return The principal
   * @return The total supply
   * @return The average stable rate
   * @return The timestamp of the last update
   */
  function getSupplyData() external view returns (uint256, uint256, uint256, uint40);

  /**
   * @notice Returns the timestamp of the last update of the total supply
   * @return The timestamp
   */
  function getTotalSupplyLastUpdated() external view returns (uint40);

  /**
   * @notice Returns the total supply and the average stable rate
   * @return The total supply
   * @return The average rate
   */
  function getTotalSupplyAndAvgRate() external view returns (uint256, uint256);

  /**
   * @notice Returns the principal debt balance of the user
   * @return The debt balance of the user since the last burn/mint action
   */
  function principalBalanceOf(address user) external view returns (uint256);

  /**
   * @notice Returns the address of the underlying asset of this stableDebtToken (E.g. WETH for stableDebtWETH)
   * @return The address of the underlying asset
   */
  function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
