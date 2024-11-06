// SPDX-License-Identifier: UNLICENSED
// All Rights Reserved © AaveCo

pragma solidity ^0.8.10;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
                      
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { Math } from "@openzeppelin/contracts-upgradeable/utils/math/Math.sol";
import {IncentivizedERC20} from "@aave/core-v3/contracts//tokenization/base/IncentivizedERC20.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts//interfaces/IPoolAddressesProvider.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IAToken} from "@aave/core-v3/contracts//interfaces/IAToken.sol";
import {DataTypes as AaveDataTypes} from "@aave/core-v3/contracts/protocol/libraries/types/DataTypes.sol";
import {WadRayMath} from "@aave/core-v3/contracts/protocol/libraries/math/WadRayMath.sol";
import {IRewardsController} from "@aave/periphery-v3/contracts/rewards/interfaces/IRewardsController.sol";
import {IATokenVault} from "./interfaces/IATokenVault.sol";
import {ATokenVaultStorage} from "./ATokenVaultStorage.sol";

/**
 * @title ATokenVault
 * @author Aave Protocol
 * @notice An ERC-4626 vault for Aave V3, with support to add a fee on yield earned.
 */
contract ATokenVault is ERC4626, Ownable, , ATokenVaultStorage, IATokenVault {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using MathUpgradeable for uint256;


    uint256 constant AAVE_ACTIVE_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFF;
    uint256 constant AAVE_FROZEN_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFDFFFFFFFFFFFFFF;
    uint256 constant AAVE_PAUSED_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFF;
    uint256 constant AAVE_SUPPLY_CAP_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFF000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    uint256 constant AAVE_SUPPLY_CAP_BIT_POSITION = 116;
    uint256 constant SCALE = 1e18;

        /// @inheritdoc IATokenVault
    IPoolAddressesProvider public immutable POOL_ADDRESSES_PROVIDER;

    /// @inheritdoc IATokenVault
    IPool public immutable AAVE_POOL;

    /// @inheritdoc IATokenVault
    IAToken public immutable ATOKEN;

    /// @inheritdoc IATokenVault
    IERC20 public immutable UNDERLYING;

    /// @inheritdoc IATokenVault
    uint16 public immutable REFERRAL_CODE;




    /**
     * @dev Constructor.
     * @param underlying The underlying ERC20 asset which can be supplied to Aave
     * @param referralCode The Aave referral code to use for deposits from this vault
     * @param poolAddressesProvider The address of the Aave v3 Pool Addresses Provider
     */
    constructor(address underlying, uint16 referralCode, IPoolAddressesProvider poolAddressesProvider) {
        _disableInitializers();
        POOL_ADDRESSES_PROVIDER = poolAddressesProvider;
        AAVE_POOL = IPool(poolAddressesProvider.getPool());
        REFERRAL_CODE = referralCode;
        UNDERLYING = IERC20Upgradeable(underlying);

        address aTokenAddress = AAVE_POOL.getReserveData(address(underlying)).aTokenAddress;
        require(aTokenAddress != address(0), "ASSET_NOT_SUPPORTED");
        ATOKEN = IAToken(aTokenAddress);
    }

    /**
     * @notice Initializes the vault, setting the initial parameters and initializing inherited contracts.
     * @dev It requires an initial non-zero deposit to prevent a frontrunning attack (in underlying tokens). Note
     * that care should be taken to provide a non-trivial amount, but this depends on the underlying asset's decimals.
     * @dev It does not initialize the OwnableUpgradeable contract to avoid setting the proxy admin as the owner.
     * @param owner The owner to set
     * @param initialFee The initial fee to set, expressed in wad, where 1e18 is 100%
     * @param shareName The name to set for this vault
     * @param shareSymbol The symbol to set for this vault
     * @param initialLockDeposit The initial amount of underlying assets to deposit
     */
    function initialize(
        address owner,
        uint256 initialFee,
        string memory shareName,
        string memory shareSymbol,
        uint256 initialLockDeposit
    ) external initializer {
        require(owner != address(0), "ZERO_ADDRESS_NOT_VALID");
        require(initialLockDeposit != 0, "ZERO_INITIAL_LOCK_DEPOSIT");
        _transferOwnership(owner);
        _setFee(initialFee);

        UNDERLYING.safeApprove(address(AAVE_POOL), type(uint256).max);

        _handleDeposit(initialLockDeposit, address(this), msg.sender, false);
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT/WITHDRAWAL LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IATokenVault
    function deposit(uint256 assets, address receiver) public override(ERC4626, IATokenVault) returns (uint256) {
        return _handleDeposit(assets, receiver, msg.sender, false);
    }

 

    /// @inheritdoc IATokenVault
    function mint(uint256 shares, address receiver) public override(ERC4626, IATokenVault) returns (uint256) {
        return _handleMint(shares, receiver, msg.sender, false);
    }

    /// @inheritdoc IATokenVault


    /// @inheritdoc IATokenVault
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override(ERC4626, IATokenVault) returns (uint256) {
        return _handleWithdraw(assets, receiver, owner, msg.sender, false);
    }

    /// @inheritdoc IATokenVault
  

    /// @inheritdoc IATokenVault
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override(ERC4626, IATokenVault) returns (uint256) {
        return _handleRedeem(shares, receiver, owner, msg.sender, false);
    }

    /// @inheritdoc IATokenVault
    function maxDeposit(address) public view override(ERC4626, IATokenVault) returns (uint256) {
        return _maxAssetsSuppliableToAave();
    }

    /// @inheritdoc IATokenVault
    function maxMint(address) public view override(ERC4626, IATokenVault) returns (uint256) {
        return _convertToShares(_maxAssetsSuppliableToAave(), MathUpgradeable.Rounding.Down);
    }

    /// @inheritdoc IATokenVault
    function maxWithdraw(address owner) public view override(ERC4626, IATokenVault) returns (uint256) {
        uint256 maxWithdrawable = _maxAssetsWithdrawableFromAave();
        return
            maxWithdrawable == 0 ? 0 : maxWithdrawable.min(_convertToAssets(balanceOf(owner), MathUpgradeable.Rounding.Down));
    }

    /// @inheritdoc IATokenVault
    function maxRedeem(address owner) public view override(ERC4626, IATokenVault) returns (uint256) {
        uint256 maxWithdrawable = _maxAssetsWithdrawableFromAave();
        return
            maxWithdrawable == 0 ? 0 : _convertToShares(maxWithdrawable, MathUpgradeable.Rounding.Down).min(balanceOf(owner));
    }

    /// @inheritdoc IATokenVault
    function previewDeposit(uint256 assets) public view override(ERC4626, IATokenVault) returns (uint256) {
        return _convertToShares(_maxAssetsSuppliableToAave().min(assets), MathUpgradeable.Rounding.Down);
    }

    /// @inheritdoc IATokenVault
    function previewMint(uint256 shares) public view override(ERC4626, IATokenVault) returns (uint256) {
        return _convertToAssets(shares, MathUpgradeable.Rounding.Up).min(_maxAssetsSuppliableToAave());
    }

    /// @inheritdoc IATokenVault
    function previewWithdraw(uint256 assets) public view override(ERC4626, IATokenVault) returns (uint256) {
        uint256 maxWithdrawable = _maxAssetsWithdrawableFromAave();
        return maxWithdrawable == 0 ? 0 : _convertToShares(maxWithdrawable.min(assets), MathUpgradeable.Rounding.Up);
    }

    /// @inheritdoc IATokenVault
    function previewRedeem(uint256 shares) public view override(ERC4626, IATokenVault) returns (uint256) {
        uint256 maxWithdrawable = _maxAssetsWithdrawableFromAave();
        return maxWithdrawable == 0 ? 0 : _convertToAssets(shares, MathUpgradeable.Rounding.Down).min(maxWithdrawable);
    }



    /*//////////////////////////////////////////////////////////////
                          ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IATokenVault
    function setFee(uint256 newFee) public override onlyOwner {
        _accrueYield();
        _setFee(newFee);
    }

    /// @inheritdoc IATokenVault
    function withdrawFees(address to, uint256 amount) public override onlyOwner {
        _accrueYield();
        require(amount <= _s.accumulatedFees, "INSUFFICIENT_FEES"); // will underflow below anyway, error msg for clarity

        _s.accumulatedFees -= uint128(amount);

        ATOKEN.transfer(to, amount);

        _s.lastVaultBalance = uint128(ATOKEN.balanceOf(address(this)));

        emit FeesWithdrawn(to, amount, _s.lastVaultBalance, _s.accumulatedFees);
    }

    /// @inheritdoc IATokenVault
    function claimRewards(address to) public override onlyOwner {
        require(to != address(0), "CANNOT_CLAIM_TO_ZERO_ADDRESS");

        address[] memory assets = new address[](1);
        assets[0] = address(ATOKEN);
        (address[] memory rewardsList, uint256[] memory claimedAmounts) = IRewardsController(
            address(IncentivizedERC20(address(ATOKEN)).getIncentivesController())
        ).claimAllRewards(assets, to);

        emit RewardsClaimed(to, rewardsList, claimedAmounts);
    }

    /// @inheritdoc IATokenVault
    function emergencyRescue(address token, address to, uint256 amount) public override onlyOwner {
        require(token != address(ATOKEN), "CANNOT_RESCUE_ATOKEN");

        IERC20Upgradeable(token).safeTransfer(to, amount);

        emit EmergencyRescue(token, to, amount);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IATokenVault
    function totalAssets() public view override(ERC4626, IATokenVault) returns (uint256) {
        // Report only the total assets net of fees, for vault share logic
        return ATOKEN.balanceOf(address(this)) - getClaimableFees();
    }

    /// @inheritdoc IATokenVault
    function getClaimableFees() public view override returns (uint256) {
        uint256 newVaultBalance = ATOKEN.balanceOf(address(this));

        // Skip computation if there is no yield
        if (newVaultBalance <= _s.lastVaultBalance) {
            return _s.accumulatedFees;
        }

        uint256 newYield = newVaultBalance - _s.lastVaultBalance;
        uint256 newFees = newYield.mulDiv(_s.fee, SCALE, MathUpgradeable.Rounding.Down);

        return _s.accumulatedFees + newFees;
    }

    /// @inheritdoc IATokenVault
    function getSigNonce(address signer) public view override returns (uint256) {
        return _sigNonces[signer];
    }

    /// @inheritdoc IATokenVault
    function getLastVaultBalance() public view override returns (uint256) {
        return _s.lastVaultBalance;
    }

    /// @inheritdoc IATokenVault
    function getFee() public view override returns (uint256) {
        return _s.fee;
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setFee(uint256 newFee) internal {
        require(newFee <= SCALE, "FEE_TOO_HIGH");

        uint256 oldFee = _s.fee;
        _s.fee = uint64(newFee);

        emit FeeUpdated(oldFee, newFee);
    }

    function _accrueYield() internal {
        uint256 newVaultBalance = ATOKEN.balanceOf(address(this));

        // Skip computation if there is no yield
        if (newVaultBalance <= _s.lastVaultBalance) {
            return;
        }

        uint256 newYield = newVaultBalance - _s.lastVaultBalance;
        uint256 newFeesEarned = newYield.mulDiv(_s.fee, SCALE, MathUpgradeable.Rounding.Down);

        _s.accumulatedFees += uint128(newFeesEarned);
        _s.lastVaultBalance = uint128(newVaultBalance);

        emit YieldAccrued(newYield, newFeesEarned, newVaultBalance);
    }

    function _handleDeposit(uint256 assets, address receiver, address depositor, bool asAToken) internal returns (uint256) {
        if (!asAToken) require(assets <= maxDeposit(receiver), "DEPOSIT_EXCEEDS_MAX");
        _accrueYield();
        uint256 shares = super.previewDeposit(assets);
        require(shares != 0, "ZERO_SHARES"); // Check for rounding error since we round down in previewDeposit.
        _baseDeposit(_convertToAssets(shares, MathUpgradeable.Rounding.Up), shares, depositor, receiver, asAToken);
        return shares;
    }

    function _handleMint(uint256 shares, address receiver, address depositor, bool asAToken) internal returns (uint256) {
        if (!asAToken) require(shares <= maxMint(receiver), "MINT_EXCEEDS_MAX");
        _accrueYield();
        uint256 assets = super.previewMint(shares); // No need to check for rounding error, previewMint rounds up.
        _baseDeposit(assets, shares, depositor, receiver, asAToken);
        return assets;
    }

    function _handleWithdraw(
        uint256 assets,
        address receiver,
        address owner,
        address allowanceTarget,
        bool asAToken
    ) internal returns (uint256) {
        _accrueYield();
        require(assets <= maxWithdraw(owner), "WITHDRAW_EXCEEDS_MAX");
        uint256 shares = super.previewWithdraw(assets); // No need to check for rounding error, previewWithdraw rounds up.
        _baseWithdraw(assets, shares, owner, receiver, allowanceTarget, asAToken);
        return shares;
    }

    function _handleRedeem(
        uint256 shares,
        address receiver,
        address owner,
        address allowanceTarget,
        bool asAToken
    ) internal returns (uint256) {
        _accrueYield();
        require(shares <= maxRedeem(owner), "REDEEM_EXCEEDS_MAX");
        uint256 assets = super.previewRedeem(shares);
        require(assets != 0, "ZERO_ASSETS"); // Check for rounding error since we round down in previewRedeem.
        _baseWithdraw(assets, shares, owner, receiver, allowanceTarget, asAToken);
        return assets;
    }

    function _maxAssetsSuppliableToAave() internal view returns (uint256) {
        // returns 0 if reserve is not active, frozen, or paused
        // returns max uint256 value if supply cap is 0 (not capped)
        // returns supply cap - current amount supplied as max suppliable if there is a supply cap for this reserve

        AaveDataTypes.ReserveData memory reserveData = AAVE_POOL.getReserveData(address(UNDERLYING));

        uint256 reserveConfigMap = reserveData.configuration.data;
        uint256 supplyCap = (reserveConfigMap & ~AAVE_SUPPLY_CAP_MASK) >> AAVE_SUPPLY_CAP_BIT_POSITION;

        if (
            (reserveConfigMap & ~AAVE_ACTIVE_MASK == 0) ||
            (reserveConfigMap & ~AAVE_FROZEN_MASK != 0) ||
            (reserveConfigMap & ~AAVE_PAUSED_MASK != 0)
        ) {
            return 0;
        } else if (supplyCap == 0) {
            return type(uint256).max;
        } else {
            // Reserve's supply cap - current amount supplied
            // See similar logic in Aave v3 ValidationLogic library, in the validateSupply function
            // https://github.com/aave/aave-v3-core/blob/a00f28e3ad7c0e4a369d8e06e0ac9fd0acabcab7/contracts/protocol/libraries/logic/ValidationLogic.sol#L71-L78
            uint256 currentSupply = WadRayMath.rayMul(
                (ATOKEN.scaledTotalSupply() + uint256(reserveData.accruedToTreasury)),
                reserveData.liquidityIndex
            );
            uint256 supplyCapWithDecimals = supplyCap * 10 ** decimals();
            return supplyCapWithDecimals > currentSupply ? supplyCapWithDecimals - currentSupply : 0;
        }
    }

    function _maxAssetsWithdrawableFromAave() internal view returns (uint256) {
        // returns 0 if reserve is not active, or paused
        // otherwise, returns available liquidity

        AaveDataTypes.ReserveData memory reserveData = AAVE_POOL.getReserveData(address(UNDERLYING));

        uint256 reserveConfigMap = reserveData.configuration.data;

        if ((reserveConfigMap & ~AAVE_ACTIVE_MASK == 0) || (reserveConfigMap & ~AAVE_PAUSED_MASK != 0)) {
            return 0;
        } else {
            return UNDERLYING.balanceOf(address(ATOKEN));
        }
    }

    function _baseDeposit(uint256 assets, uint256 shares, address depositor, address receiver, bool asAToken) private {
        // Need to transfer before minting or ERC777s could reenter.
        if (asAToken) {
            ATOKEN.transferFrom(depositor, address(this), assets);
        } else {
            UNDERLYING.safeTransferFrom(depositor, address(this), assets);
            AAVE_POOL.supply(address(UNDERLYING), assets, address(this), REFERRAL_CODE);
        }
        _s.lastVaultBalance = uint128(ATOKEN.balanceOf(address(this)));

        _mint(receiver, shares);

        emit Deposit(depositor, receiver, assets, shares);
    }

    function _baseWithdraw(
        uint256 assets,
        uint256 shares,
        address owner,
        address receiver,
        address allowanceTarget,
        bool asAToken
    ) private {
        if (allowanceTarget != owner) {
            _spendAllowance(owner, allowanceTarget, shares);
        }

        _burn(owner, shares);

        // Withdraw assets from Aave v3 and send to receiver
        if (asAToken) {
            ATOKEN.transfer(receiver, assets);
        } else {
            AAVE_POOL.withdraw(address(UNDERLYING), assets, receiver);
        }
        _s.lastVaultBalance = uint128(ATOKEN.balanceOf(address(this)));

        emit Withdraw(allowanceTarget, receiver, owner, assets, shares);
    }
}