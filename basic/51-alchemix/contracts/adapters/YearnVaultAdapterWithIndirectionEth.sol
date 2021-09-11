// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

import {FixedPointMath} from "../libraries/FixedPointMath.sol";
import {IDetailedERC20} from "../interfaces/IDetailedERC20.sol";
import {IVaultAdapter} from "../interfaces/IVaultAdapter.sol";
import {IyVaultV2} from "../interfaces/IyVaultV2.sol";
import {YearnVaultAdapter} from "./YearnVaultAdapter.sol";

/// @title YearnVaultAdapter
///
/// @dev A vault adapter implementation which wraps a yEarn vault.
contract YearnVaultAdapterWithIndirectionEth is YearnVaultAdapter {
    using FixedPointMath for FixedPointMath.FixedDecimal;
    using SafeERC20 for IDetailedERC20;
    using SafeERC20 for IyVaultV2;
    using SafeMath for uint256;

    constructor(IyVaultV2 _vault, address _admin) YearnVaultAdapter(_vault, _admin) public {
    }

    /// @dev Sends vault tokens to the recipient
    ///
    /// This function reverts if the caller is not the admin.
    ///
    /// @param _recipient the account to send the tokens to.
    /// @param _amount    the amount of tokens to send.
    function indirectWithdraw(address _recipient, uint256 _amount) external onlyAdmin {
        vault.safeTransfer(_recipient, _tokensToShares(_amount));
    }
}