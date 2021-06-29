//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Exchange.sol";

contract Factory {
    mapping(address => address) public tokenToExchange;

    function createExchange(address _tokenAddress) public returns (address) {
        // 确保token 地址不是 address 0
        require(_tokenAddress != address(0), "invalid token address");
        // 确保 新建的交易所 地址是 address 0 （代表该交易对的交易所还未创建）
        // 保证同一个 交易对 地址相同，不会出现多个交易所的情况
        // 我们不希望流动性分散在多个交易所，最好集中在一个交易所以减少滑点并提供更好的汇率。
        require(
            tokenToExchange[_tokenAddress] == address(0),
            "exchange already exists"
        );

        Exchange exchange = new Exchange(_tokenAddress);
        tokenToExchange[_tokenAddress] = address(exchange);

        return address(exchange);
    }

    function getExhange(address _tokenAddress) public view returns (address) {
        return tokenToExchange[_tokenAddress];
    }
}
