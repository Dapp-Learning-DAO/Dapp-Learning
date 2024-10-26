// // SPDX-License-Identifier: UNLICENSED
// // All Rights Reserved © AaveCo

// pragma solidity ^0.8.10;

// import {IERC20Upgradeable} from "@openzeppelin-upgradeable/interfaces/IERC20Upgradeable.sol";
// import {IERC4626Upgradeable} from "@openzeppelin-upgradeable/interfaces/IERC4626Upgradeable.sol";
// import {IPoolAddressesProvider} from "@aave-v3-core/interfaces/IPoolAddressesProvider.sol";
// import {IPool} from "@aave-v3-core/interfaces/IPool.sol";
// import {IAToken} from "@aave-v3-core/interfaces/IAToken.sol";
// import {IRewardsController} from "@aave-v3-periphery/rewards/interfaces/IRewardsController.sol";

// /**
//  * @title IATokenVault
//  * @author Aave Protocol
//  *
//  * @notice Defines the basic interface of the ATokenVault
//  */
// interface IATokenVault is IERC4626Upgradeable {
//     /**
//      * @notice A struct containing the necessary information to reconstruct an EIP-712 typed data signature.
//      *
//      * @param v The signature's recovery parameter.
//      * @param r The signature's r parameter.
//      * @param s The signature's s parameter
//      * @param deadline The signature's deadline
//      */
//     struct EIP712Signature {
//         uint8 v;
//         bytes32 r;
//         bytes32 s;
//         uint256 deadline;
//     }

//     /**
//      * @dev Emitted when the fee is updated
//      * @param oldFee The old value of the fee
//      * @param newFee The new value of the fee
//      */
//     event FeeUpdated(uint256 indexed oldFee, uint256 indexed newFee);

//     /**
//      * @dev Emitted when fees are withdrawn
//      * @param to The recipient address where the fees are sent to
//      * @param amount The amount of fess withdrawn, in aTokens
//      * @param newVaultBalance The new balance of the vault, in aTokens
//      * @param newTotalFeesAccrued The total amount of fees accrued outstanding after the withdraw, in aTokens
//      */
//     event FeesWithdrawn(address indexed to, uint256 indexed amount, uint256 newVaultBalance, uint256 newTotalFeesAccrued);

//     /**
//      * @dev Emitted when Aave yield is accrued
//      * @param accruedYield The yield accrued since the last vault interaction, in aTokens
//      * @param newFeesFromYield The amount of fees earned from the accrued yield, in aTokens
//      * @param newVaultBalance The new balance of the vault, in aTokens
//      */
//     event YieldAccrued(uint256 accruedYield, uint256 newFeesFromYield, uint256 newVaultBalance);

//     /**
//      * @dev Emitted when Aave rewards are claimed
//      * @param to The recipient address where the claimed rewards are sent to
//      * @param rewardsList The list of rewards address that have been claimed
//      * @param claimedAmounts The list of rewards amount that have been claimed
//      */
//     event RewardsClaimed(address indexed to, address[] rewardsList, uint256[] claimedAmounts);

//     /**
//      * @dev Emitted when an emergency rescue of tokens has been made
//      * @param token The address of the token that has been rescued
//      * @param to The recipient address where the rescued tokens are sent to
//      * @param amount The amount of tokens rescued
//      */
//     event EmergencyRescue(address indexed token, address indexed to, uint256 amount);

//     /**
//      * @notice Returns the address of the Aave Pool Addresses Provider
//      * @return The address of the Aave PoolAddressesProvider contract
//      */
//     function POOL_ADDRESSES_PROVIDER() external view returns (IPoolAddressesProvider);

//     /**
//      * @notice Returns the address of the Aave Pool
//      * @return The address of the Aave Pool contract
//      */
//     function AAVE_POOL() external view returns (IPool);

//     /**
//      * @notice Returns the address of the AToken
//      * @return The address of the AToken contract
//      */
//     function ATOKEN() external view returns (IAToken);

//     /**
//      * @notice Returns the address of the underlying asset of the vault
//      * @return The address of the underlying asset
//      */
//     function UNDERLYING() external view returns (IERC20Upgradeable);

//     /**
//      * @notice Returns the referral code to use for Aave interactions
//      * @return The Aave referral code
//      */
//     function REFERRAL_CODE() external view returns (uint16);

//     /**
//      * @notice Deposits a specified amount of assets into the vault, minting a corresponding amount of shares.
//      * @dev The assets transferred in could be lesser than the passed amount due to rounding issues
//      * @param assets The amount of underlying asset to deposit
//      * @param receiver The address to receive the shares
//      * @return shares The amount of shares minted to the receiver
//      */
//     function deposit(uint256 assets, address receiver) external override returns (uint256 shares);



//     /**
//      * @notice Mints a specified amount of shares to the receiver, depositing the corresponding amount of assets.
//      * @param shares The amount of shares to mint
//      * @param receiver The address to receive the shares
//      * @return assets The amount of assets deposited by the caller
//      */
//     function mint(uint256 shares, address receiver) external override returns (uint256 assets);

      
//     /**
//      * @notice Withdraws a specified amount of assets from the vault, burning the corresponding amount of shares.
//      * @param assets The amount of assets to withdraw
//      * @param receiver The address to receive the assets
//      * @param owner The address from which to pull the shares for the withdrawal
//      * @return shares The amount of shares burnt in the withdrawal process
//      */
//     function withdraw(uint256 assets, address receiver, address owner) external override returns (uint256 shares);

   
//     /**
//      * @notice Burns a specified amount of shares from the vault, withdrawing the corresponding amount of assets.
//      * @param shares The amount of shares to burn
//      * @param receiver The address to receive the assets
//      * @param owner The address from which to pull the shares for the withdrawal
//      * @return assets The amount of assets withdrawn by the receiver
//      */
//     function redeem(uint256 shares, address receiver, address owner) external override returns (uint256 assets);

   
//     /**
//      * @notice Returns the maximum amount of assets that can be deposited into the vault.
//      * @dev It takes Aave Pool limitations into consideration
//      * @return maxAssets The maximum amount of assets that can be deposited into the vault
//      */
//     function maxDeposit(address) external view override returns (uint256 maxAssets);

//     /**
//      * @notice Returns the maximum amount of shares that can be minted for the vault.
//      * @dev It takes Aave Pool limitations into consideration
//      * @return maxShares The maximum amount of shares that can be minted for the vault
//      */
//     function maxMint(address) external view override returns (uint256 maxShares);

//     /**
//      * @notice Returns the maximum amount of assets that can be withdrawn from the owner balance in the vault.
//      * @dev It takes Aave Pool limitations into consideration
//      * @return maxAssets The maximum amount of assets that can be withdrawn
//      */
//     function maxWithdraw(address owner) external view override returns (uint256 maxAssets);

//     /**
//      * @notice Returns the maximum amount of shares that can be redeemed from the owner balance in the vault.
//      * @dev It takes Aave Pool limitations into consideration
//      * @return maxShares The maximum amount of shares that can be redeemed
//      */
//     function maxRedeem(address owner) external view override returns (uint256 maxShares);

//     /**
//      * @notice Allows a user to simulate a deposit at the current block, given current on-chain conditions.
//      * @dev It takes Aave Pool limitations into consideration
//      * @param assets The amount of assets the deposit simulation uses
//      * @return shares The amount of shares that would be minted to the receiver
//      */
//     function previewDeposit(uint256 assets) external view override returns (uint256 shares);

//     /**
//      * @notice Allows a user to simulate a mint at the current block, given current on-chain conditions.
//      * @dev It takes Aave Pool limitations into consideration
//      * @param shares The amount of shares the mint simulation uses
//      * @return assets The amount of assets that would be deposited by the caller
//      */
//     function previewMint(uint256 shares) external view override returns (uint256 assets);

//     /**
//      * @notice Allows a user to simulate a withdraw at the current block, given current on-chain conditions.
//      * @dev It takes Aave Pool limitations into consideration
//      * @param assets The amount of assets the withdraw simulation uses
//      * @return shares The amount of shares that would be burnt in the withdrawal process
//      */
//     function previewWithdraw(uint256 assets) external view override returns (uint256 shares);

//     /**
//      * @notice Allows a user to simulate a redeem at the current block, given current on-chain conditions.
//      * @dev It takes Aave Pool limitations into consideration
//      * @param shares The amount of shares the redeem simulation uses
//      * @return assets The amount of assets that would be withdrawn by the receiver
//      */
//     function previewRedeem(uint256 shares) external view override returns (uint256 assets);

//     /**
//      * @notice Returns the domain separator for the current chain.
//      * @return The domain separator
//      */
//     function domainSeparator() external view returns (bytes32);

//     /**
//      * @notice Sets the fee the vault levies on yield earned.
//      * @dev Only callable by the owner
//      * @param newFee The new fee to set, expressed in wad, where 1e18 is 100%
//      */
//     function setFee(uint256 newFee) external;

//     /**
//      * @notice Withdraws fees earned by the vault, in the form of aTokens, to a specified address.
//      * @dev Only callable by the owner
//      * @param to The address to receive the fees
//      * @param amount The amount of fees to withdraw
//      */
//     function withdrawFees(address to, uint256 amount) external;

//     /**
//      * @notice Claims any additional Aave rewards earned from vault deposits.
//      * @dev Only callable by the owner
//      * @param to The address to receive any rewards tokens
//      */
//     function claimRewards(address to) external;

//     /**
//      * @notice Rescue any tokens other than the vault's aToken which may have accidentally been transferred to this
//      * contract.
//      * @dev Only callable by the owner
//      * @param token The address of the token to rescue
//      * @param to The address to receive rescued tokens
//      * @param amount The amount of tokens to transfer
//      */
//     function emergencyRescue(address token, address to, uint256 amount) external;

//     /**
//      * @notice Returns the total assets less claimable fees.
//      * @return totalManagedAssets The total assets less claimable fees
//      */
//     function totalAssets() external view override returns (uint256 totalManagedAssets);

//     /**
//      * @notice Returns the claimable fees.
//      * @return The claimable fees
//      */
//     function getClaimableFees() external view returns (uint256);

//     /**
//      * @notice Returns the signing nonce for meta-transactions for the given signer.
//      * @return The passed signer's nonce
//      */
//     function getSigNonce(address signer) external view returns (uint256);

//     /**
//      * @notice Returns the vault balance at the latest update timestamp.
//      * @return The latest vault balance
//      */
//     function getLastVaultBalance() external view returns (uint256);

//     /**
//      * @notice Returns the current fee ratio.
//      * @return The current fee ratio, expressed in wad, where 1e18 is 100%
//      */
//     function getFee() external view returns (uint256);
// }