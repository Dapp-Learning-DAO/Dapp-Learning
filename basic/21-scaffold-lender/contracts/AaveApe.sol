// SPDX-License-Identifier: agpl-3.0
pragma solidity >=0.6.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./AaveUniswapBase.sol";

contract AaveApe is AaveUniswapBase {

  constructor(address lendingPoolAddressesProviderAddress, address uniswapRouterAddress) AaveUniswapBase(lendingPoolAddressesProviderAddress, uniswapRouterAddress) public {}

  event Ape(address ape, string action, address apeAsset, address borrowAsset, uint256 borrowAmount, uint256 apeAmount, uint256 interestRateMode);

  // Gets the amount available to borrow for a given address for a given asset
  function getAvailableBorrowInAsset(address borrowAsset, address ape) public view returns (uint256) {
    ( ,,uint256 availableBorrowsETH,,,) = LENDING_POOL().getUserAccountData(ape);
    return getAssetAmount(borrowAsset, availableBorrowsETH);
  }

  // Converts an amount denominated in ETH into an asset based on the Aave oracle
  function getAssetAmount(address asset, uint256 amountInEth) public view returns (uint256) {
    uint256 assetPrice = getPriceOracle().getAssetPrice(asset);
    (uint256 decimals ,,,,,,,,,) = getProtocolDataProvider().getReserveConfigurationData(asset);
    uint256 assetAmount = amountInEth.mul(10**decimals).div(assetPrice);
    return assetAmount;
  }

  // 1. Borrows the maximum amount available of a borrowAsset (in the designated interest rate mode)
  // Note: requires the user to have delegated credit to the Aave Ape Contract
  // 2. Converts it into apeAsset via Uniswap
  // 3. Deposits that apeAsset into Aave on  behalf of the borrower
  function ape(address apeAsset, address borrowAsset, uint256 interestRateMode) public returns (bool) {

      // Get the maximum amount available to borrow in the borrowAsset
      uint256 borrowAmount = getAvailableBorrowInAsset(borrowAsset, msg.sender);

      require(borrowAmount > 0, "Requires credit on Aave!");

      ILendingPool _lendingPool = LENDING_POOL();

      // Borrow from Aave
      _lendingPool.borrow(
        borrowAsset,
        borrowAmount,
        interestRateMode,
        0,
        msg.sender
      );

      // Approve the Uniswap Router on the borrowed asset
      IERC20(borrowAsset).approve(UNISWAP_ROUTER_ADDRESS, borrowAmount);

      // Execute trade on Uniswap
      address[] memory path = new address[](2);
      path[0] = borrowAsset;
      path[1] = apeAsset;

      uint[] memory amounts = UNISWAP_ROUTER.swapExactTokensForTokens(borrowAmount, 0, path, address(this), block.timestamp + 5);

      // get the output amount, approve the Lending Pool to move that amount of erc20 & deposit
      uint outputAmount = amounts[amounts.length - 1];
      IERC20(apeAsset).approve(ADDRESSES_PROVIDER.getLendingPool(), outputAmount);

      _lendingPool.deposit(
        apeAsset,
        outputAmount,
        msg.sender,
        0
      );

      emit Ape(msg.sender, 'open', apeAsset, borrowAsset, borrowAmount, outputAmount, interestRateMode);

      return true;
  }

  function superApe(address apeAsset, address borrowAsset, uint256 interestRateMode, uint levers) public returns (bool) {

    // Call "ape" for the number of levers specified
    for (uint i = 0; i < levers; i++) {
      ape(apeAsset, borrowAsset, interestRateMode);
    }

    return true;
  }

  function uniswapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address fromAsset,
    address toAsset
  ) internal returns (uint[] memory amounts) {

    // Approve the transfer
    IERC20(fromAsset).approve(UNISWAP_ROUTER_ADDRESS, amountInMax);

    // Prepare and execute the swap
    address[] memory path = new address[](2);
    path[0] = fromAsset;
    path[1] = toAsset;

    return UNISWAP_ROUTER.swapTokensForExactTokens(amountOut, amountInMax, path, address(this), block.timestamp + 5);
  }

  // Unwind a position (long apeAsset, short borrowAsset)
  function unwindApe(address apeAsset, address borrowAsset, uint256 interestRateMode) public {

    // Get the user's outstanding debt
    (,uint256 stableDebt, uint256 variableDebt,,,,,,) = getProtocolDataProvider().getUserReserveData(borrowAsset, msg.sender);

    uint256 repayAmount;
    if(interestRateMode == 1) {
      repayAmount = stableDebt;
    } else if (interestRateMode == 2) {
      repayAmount = variableDebt;
    }

    require(repayAmount > 0, "Requires debt on Aave!");

    // Prepare the flashLoan parameters
    address receiverAddress = address(this);

    address[] memory assets = new address[](1);
    assets[0] = borrowAsset;

    uint256[] memory amounts = new uint256[](1);
    amounts[0] = repayAmount;

    // 0 = no debt, 1 = stable, 2 = variable
    uint256[] memory modes = new uint256[](1);
    modes[0] = 0;

    address onBehalfOf = address(this);
    bytes memory params = abi.encode(msg.sender, apeAsset, interestRateMode);
    uint16 referralCode = 0;

    LENDING_POOL().flashLoan(
        receiverAddress,
        assets,
        amounts,
        modes,
        onBehalfOf,
        params,
        referralCode
    );

  }

  // This is the function that the Lending pool calls when flashLoan has been called and the funds have been flash transferred
  function executeOperation(
          address[] calldata assets,
          uint256[] calldata amounts,
          uint256[] calldata premiums,
          address initiator,
          bytes calldata params
      )
          external
          returns (bool)
      {
        require(msg.sender == ADDRESSES_PROVIDER.getLendingPool(), 'only the lending pool can call this function');
        require(initiator == address(this), 'the ape did not initiate this flashloan');

        // Calculate the amount owed back to the lendingPool
        address borrowAsset = assets[0];
        uint256 repayAmount = amounts[0];
        uint256 amountOwing = repayAmount.add(premiums[0]);

        // Decode the parameters
        (address ape, address apeAsset, uint256 rateMode) = abi.decode(params, (address, address, uint256));

        // Close position & repay the flashLoan
        return closePosition(ape, apeAsset, borrowAsset, repayAmount, amountOwing, rateMode);

      }

  function closePosition(address ape, address apeAsset, address borrowAsset, uint256 repayAmount, uint256 amountOwing, uint256 rateMode) internal returns (bool) {

    // Approve the lendingPool to transfer the repay amount
    IERC20(borrowAsset).approve(ADDRESSES_PROVIDER.getLendingPool(), repayAmount);

    // Repay the amount owed
    LENDING_POOL().repay(
      borrowAsset,
      repayAmount,
      rateMode,
      ape
    );

    // Calculate the amount available to withdraw (the smaller of the borrow allowance and the aToken balance)
    uint256 maxCollateralAmount = getAvailableBorrowInAsset(apeAsset, ape);

    DataTypes.ReserveData memory reserve = getAaveAssetReserveData(apeAsset);

    IERC20 _aToken = IERC20(reserve.aTokenAddress);

    if(_aToken.balanceOf(ape) < maxCollateralAmount) {
      maxCollateralAmount = _aToken.balanceOf(ape);
    }

    // transfer the aTokens to this address, then withdraw the Tokens from Aave
    _aToken.transferFrom(ape, address(this), maxCollateralAmount);

    LENDING_POOL().withdraw(
      apeAsset,
      maxCollateralAmount,
      address(this)
    );

    // Make the swap on Uniswap
    IERC20(apeAsset).approve(UNISWAP_ROUTER_ADDRESS, maxCollateralAmount);

    uint[] memory amounts = uniswapTokensForExactTokens(amountOwing, maxCollateralAmount, apeAsset, borrowAsset);

    // Deposit any leftover back into Aave on behalf of the user
    uint256 leftoverAmount = maxCollateralAmount.sub(amounts[0]);

    if(leftoverAmount > 0) {

      IERC20(apeAsset).approve(ADDRESSES_PROVIDER.getLendingPool(), leftoverAmount);

      LENDING_POOL().deposit(
        apeAsset,
        leftoverAmount,
        ape,
        0
      );
    }

    // Approve the Aave Lending Pool to recover the flashloaned amount
    IERC20(borrowAsset).approve(ADDRESSES_PROVIDER.getLendingPool(), amountOwing);

    emit Ape(ape, 'close', apeAsset, borrowAsset, amountOwing, amounts[0], rateMode);

    return true;
  }

}
