// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.10;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

// interface IFaucet {
//     function mint(address _token, uint256 _amount) external;
// }

// abstract contract FlashLoanSimpleReceiverBase is IFlashLoanSimpleReceiver {
//     IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
//     IPool public immutable override POOL;
//     IFaucet public immutable FAUCET;

//     constructor(IPoolAddressesProvider provider, IFaucet faucet) {
//         ADDRESSES_PROVIDER = provider;
//         POOL = IPool(provider.getPool());
//         FAUCET = faucet;
//     }
// }

contract MintFlashLoan is FlashLoanSimpleReceiverBase {
    constructor(address _addressProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {}

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Logic go here.

        // Approve the LendingPool contract allowance to *pull* the owed amount
        uint256 amountOwed = amount + premium;
      //  FAUCET.mint(asset, premium);
        IERC20(asset).approve(address(POOL), amountOwed);

        return true;
    }

    function executeFlashLoan(address asset, uint256 amount) public {
        address receiverAddress = address(this);

        bytes memory params = "";
        uint16 referralCode = 0;

        POOL.flashLoanSimple(receiverAddress, asset, amount, params, referralCode);
    }

    function getBalance(address _tokenAddress) external view returns(uint256) {
    return IERC20(_tokenAddress).balanceOf(address(this));
   }

}