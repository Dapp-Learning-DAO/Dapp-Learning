pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./lib/DydxFlashloanBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface WETH9 {
    function deposit() external payable;
    function withdraw(uint wad) external;
}

contract DydxFlashloaner is DydxFlashloanBase {
    address public owner;

    address public dydxSoloMarginAddr = 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e;
    address public WETHAddr = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address public kovanDydxSoloMarginAddr = 0x4EC3570cADaAEE08Ae384779B0f3A45EF85289DE;
    address public kovanWETHAddr = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;

    constructor() public {
        owner = msg.sender;
    }

    struct MyCustomData {
        address token;
        uint256 repayAmount;
    }

    function callFunction(
        address sender,
        Account.Info memory account,
        bytes memory data
    ) public {
        MyCustomData memory mcd = abi.decode(data, (MyCustomData));
        uint256 balOfLoanedToken = IERC20(mcd.token).balanceOf(address(this));

        // Note that you can ignore the line below
        // if your dydx account (this contract in this case)
        // has deposited at least ~2 Wei of assets into the account
        // to balance out the collaterization ratio

        WETH9(kovanWETHAddr).deposit{value: balOfLoanedToken.add(2)};
        uint256 newBal = IERC20(mcd.token).balanceOf(address(this));

        require(
            newBal >= mcd.repayAmount,
            "Not enough funds to repay dydx loan!"
        );

    }

    // _solo  = dydxAddr
    // _token = WETHAddr
    // _amount 借贷数量
    function initiateFlashLoan(address _solo, address _token, uint256 _amount)
        external
    {
        ISoloMargin solo = ISoloMargin(_solo);

        // Get marketId from token address
        uint256 marketId = _getMarketIdFromTokenAddress(_solo, _token);

        // Calculate repay amount (_amount + (2 wei))
        // Approve transfer from
        uint256 repayAmount = _getRepaymentAmountInternal(_amount);
        IERC20(_token).approve(_solo, repayAmount);

        // 1. Withdraw $
        // 2. Call callFunction(...)
        // 3. Deposit back $
        Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

        operations[0] = _getWithdrawAction(marketId, _amount);
        operations[1] = _getCallAction(
            // Encode MyCustomData for callFunction
            abi.encode(MyCustomData({token: _token, repayAmount: repayAmount}))
        );
        operations[2] = _getDepositAction(marketId, repayAmount);

        Account.Info[] memory accountInfos = new Account.Info[](1);
        accountInfos[0] = _getAccountInfo();

        solo.operate(accountInfos, operations);
    }
}
