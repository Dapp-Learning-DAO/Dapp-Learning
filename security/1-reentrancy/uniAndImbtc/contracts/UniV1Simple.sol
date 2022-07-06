pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniV1Simple {

    IERC20 private erc20;

    constructor(address erc20_) {
        erc20 = IERC20(erc20_);
    }

    //take ETH as input ,get token as output. Specify how much you sold
    function ethToTokenInput(uint256 min_tokens) external payable{
        uint256 eth_sold = msg.value;
        uint256 eth_reserve = address(this).balance - msg.value;
        uint256 token_reserve = erc20.balanceOf(address(this));
        uint256 token_bought = getInputPrice(eth_sold, eth_reserve, token_reserve);
        require(token_bought >= min_tokens, "UniV1: Not enough");
        require(erc20.transferFrom(address(this), msg.sender, token_bought), "UniV1: Transfer failed");
    }

    //take ETH as input ,get token as output. Specify how much you bought
    function ethToTokenOutput(uint256 token_bought) external payable{
        uint256 eth_reserve = address(this).balance - msg.value;
        uint256 token_reserve = erc20.balanceOf(address(this));
        uint256 eth_sold = getOutputPrice(token_bought, eth_reserve, token_reserve);
        require(msg.value >= eth_sold, "UniV1: Not enough");
        if (msg.value > eth_sold) {
            payable(msg.sender).transfer(msg.value - eth_sold);
        }
        require(erc20.transferFrom(address(this), msg.sender, token_bought), "UniV1: Transfer failed");
    }

    //take token as input, get eth as output. Specify how much input
    function tokenToEthInput(uint256 token_sold) external {
        require(erc20.allowance(msg.sender, address(this)) >= token_sold, "UniV1: Not approved");
        uint256 eth_reserve = address(this).balance;
        uint256 token_reserve = erc20.balanceOf(address(this));
        uint256 eth_bought = getInputPrice(token_sold, token_reserve, eth_reserve);
        payable(msg.sender).transfer(eth_bought);
        require(erc20.transferFrom(msg.sender, address(this), token_sold), "UniV1: Transfer failed");
    }

    function tokenToEthOutput(uint256 eth_bought) external {
        uint256 token_reserve = erc20.balanceOf(address(this));
        uint256 eth_reserve = address(this).balance;
        uint256 token_sold = getOutputPrice(eth_bought, token_reserve, eth_reserve);
        require(erc20.transferFrom(msg.sender, address(this), token_sold), "UniV1: Transfer failed");
        payable(msg.sender).transfer(eth_bought);
    }

    //(x+Δx) (y-Δy) = xy
    //...
    //Δy = (Δx * y) / (x + Δx)
    function getInputPrice(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) internal pure returns(uint256){
        input_amount = input_amount * 997;//0.3% fee
        input_reserve = input_reserve * 1000;
        uint256 nominator = input_amount * output_reserve;
        uint256 denominator = input_amount + input_reserve;
        return nominator / denominator;
    }


    function getOutputPrice(uint256 output_amount, uint256 input_reserve, uint256 output_reserve) internal pure returns(uint256) {
        uint256 nominator = input_reserve * output_amount;
        uint256 denominator = output_reserve - output_amount;
        return nominator / denominator;
    }

}