pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
contract UniV1Simple is ERC20{

    IERC20 private erc20;

    constructor(address erc20_) ERC20("TEST", "TEST"){
        erc20 = IERC20(erc20_);
    }

    //take ETH as input ,get token as output. Specify how much you sold
    function ethToTokenInput(uint256 min_tokens) external payable returns(uint256){
        uint256 eth_sold = msg.value;
        uint256 eth_reserve = address(this).balance - msg.value;
        uint256 token_reserve = erc20.balanceOf(address(this));
        uint256 token_bought = getInputPrice(eth_sold, eth_reserve, token_reserve);
        require(token_bought >= min_tokens, "UniV1: Not enough");
        require(erc20.transfer(msg.sender, token_bought), "UniV1: Transfer failed");
        return token_bought;
    }

    //take token as input, get eth as output. Specify how much input
    function tokenToEthInput(uint256 token_sold) external returns(uint256){
        uint256 eth_reserve = address(this).balance;
        uint256 token_reserve = erc20.balanceOf(address(this));
        uint256 eth_bought = getInputPrice(token_sold, token_reserve, eth_reserve);
        payable(msg.sender).transfer(eth_bought);
        require(erc20.transferFrom(msg.sender, address(this), token_sold), "UniV1: Transfer failed");
        return eth_bought;
    }

    function addLiquidity(uint256 max_token) external payable returns(uint256){
        if (totalSupply() > 0) {
            uint256 eth_reserve = address(this).balance - msg.value;
            uint256 token_reserve = erc20.balanceOf(address(this));
            uint256 actual_token = (msg.value * token_reserve / eth_reserve) + 1;
            require(actual_token <= max_token, "UniV1: Exceed limit");
            require(erc20.transferFrom(msg.sender, address(this), actual_token), "UniV1: Transfer failed");
            
            uint256 liquid_minted = msg.value * totalSupply() / eth_reserve;
            _mint(msg.sender, liquid_minted);
            return liquid_minted;
            
        } else {
            //mint initial uni tokens. how many?
            //transfer erc 20 token (eth already added to balance)
            uint256 initial_mint = address(this).balance;
            _mint(msg.sender, initial_mint);
            require(erc20.transferFrom(msg.sender, address(this), max_token), "UniV1: Transfer failed");
            return initial_mint;
        }
    }


    //(x+Δx) (y-Δy) = xy
    //...
    //Δy = (Δx * y) / (x + Δx)
    //Note: To illustrate clearly I've ignore the fee parts
    function getInputPrice(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) internal pure returns(uint256){
        input_amount = input_amount;
        uint256 nominator = input_amount * output_reserve;
        uint256 denominator = input_amount + input_reserve;
        return nominator / denominator;
    }
}