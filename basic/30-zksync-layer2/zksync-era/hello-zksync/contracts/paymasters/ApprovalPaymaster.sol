// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @author Matter Labs
/// @notice This smart contract pays the gas fees for accounts with balance of a specific ERC20 token. It makes use of the approval-based flow paymaster.
contract ApprovalPaymaster is IPaymaster, Ownable {
    uint256 constant PRICE_FOR_PAYING_FEES = 1;

    address public allowedToken;

    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this method"
        );
        // Continue execution if called from the bootloader.
        _;
    }

    constructor(address _erc20) {
        allowedToken = _erc20;
    }

    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    )
        external
        payable
        onlyBootloader
        returns (bytes4 magic, bytes memory context)
    {
        // By default we consider the transaction as accepted.
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
        require(
            _transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long"
        );

        bytes4 paymasterInputSelector = bytes4(
            _transaction.paymasterInput[0:4]
        );
        // Approval based flow
        if (paymasterInputSelector == IPaymasterFlow.approvalBased.selector) {
            // While the transaction data consists of address, uint256 and bytes data,
            // the data is not needed for this paymaster
            (address token, uint256 amount, bytes memory data) = abi.decode(
                _transaction.paymasterInput[4:],
                (address, uint256, bytes)
            );

            // Verify if token is the correct one
            require(token == allowedToken, "Invalid token");

            // We verify that the user has provided enough allowance
            address userAddress = address(uint160(_transaction.from));

            address thisAddress = address(this);

            uint256 providedAllowance = IERC20(token).allowance(
                userAddress,
                thisAddress
            );
            require(
                providedAllowance >= PRICE_FOR_PAYING_FEES,
                "Min allowance too low"
            );

            // Note, that while the minimal amount of ETH needed is tx.gasPrice * tx.gasLimit,
            // neither paymaster nor account are allowed to access this context variable.
            uint256 requiredETH = _transaction.gasLimit *
                _transaction.maxFeePerGas;

            try
                IERC20(token).transferFrom(userAddress, thisAddress, amount)
            {} catch (bytes memory revertReason) {
                // If the revert reason is empty or represented by just a function selector,
                // we replace the error with a more user-friendly message
                if (revertReason.length <= 4) {
                    revert("Failed to transferFrom from users' account");
                } else {
                    assembly {
                        revert(add(0x20, revertReason), mload(revertReason))
                    }
                }
            }

            // The bootloader never returns any data, so it can safely be ignored here.
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{
                value: requiredETH
            }("");
            require(
                success,
                "Failed to transfer tx fee to the bootloader. Paymaster balance might not be enough."
            );
        } else {
            revert("Unsupported paymaster flow");
        }
    }

    function postTransaction(
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable override onlyBootloader {}

    function withdraw(address _to) external onlyOwner {
        (bool success, ) = payable(_to).call{value: address(this).balance}("");
        require(success, "Failed to withdraw funds from paymaster.");
    }

    receive() external payable {}
}
