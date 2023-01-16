pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../libs/EntryPointManager.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//More details in https://docs.chain.link/data-feeds/price-feeds/addresses/?network=ethereum
contract USDCPaymaster is IPaymaster, Ownable, EntryPointManager {
    
    AggregatorV3Interface internal priceFeed;
    IERC20 internal usdc;

    constructor(address _entryPoint) EntryPointManager(_entryPoint){
        //USDC to eth, it returns how many wei one usdc worths
        priceFeed = AggregatorV3Interface(0x986b5E1e1755e3C2440e960477f25201B0a8bbD4);
        usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    }

    //用于证明自己真的愿意为这笔钱支付。
    function validatePaymasterUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
    external override returns (bytes memory context, uint256 sigTimeRange) {
        //1. Must be from entryPoint
        _requireEntryPoint();

        //2. Convert eth to USDC
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        uint256 priceUint = uint256(price);
        uint256 usdcAmount = (maxCost + priceUint - 1) / priceUint;

        //3. Sender must have the ability pay this token
        address sender = userOp.sender;
        uint256 balanceOfSender = usdc.balanceOf(sender);
        require(balanceOfSender >= usdcAmount, "sender does not have enough balance");

        //4. Sender must approve this sender first.
        uint256 allowance = usdc.allowance(sender, address(this));
        require(allowance >= usdcAmount, "Not enough allowance for paymaster");
        
        //5. Transfer usdc to paymaster
        require(usdc.transferFrom(sender, address(this), balanceOfSender), "prepay failed");

        //6. Encode context
        return (abi.encode(sender), 0);
    }


    //Empty 
    function postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost) external override{
        //1. Verify
        _requireEntryPoint();
        (address sender) = abi.decode(context, (address));

        //TODO:check op execute status

        //2. Refund
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        uint256 priceUint = uint256(price);

        uint256 usdcAmount = (actualGasCost + priceUint - 1) / priceUint;
        require(usdc.transfer(sender, usdcAmount), "refund failed");
        
        
    }
}