pragma solidity ^0.4.20;
import "./UniswapExchange.sol";


contract FactoryInterface {
    address[] public tokenList;
    mapping(address => address) tokenToExchange;
    mapping(address => address) exchangeToToken;
    function launchExchange(address _token) public returns (address exchange);
    function getExchangeCount() public view returns (uint exchangeCount);
    function tokenToExchangeLookup(address _token) public view returns (address exchange);
    function exchangeToTokenLookup(address _exchange) public view returns (address token);
    event ExchangeLaunch(address indexed exchange, address indexed token);
}


contract UniswapFactory is FactoryInterface {
    event ExchangeLaunch(address indexed exchange, address indexed token);

    // index of tokens with registered exchanges
    address[] public tokenList;
    mapping(address => address) tokenToExchange;
    mapping(address => address) exchangeToToken;

    function launchExchange(address _token) public returns (address exchange) {
        require(tokenToExchange[_token] == address(0));             //There can only be one exchange per token
        require(_token != address(0) && _token != address(this));
        UniswapExchange newExchange = new UniswapExchange(_token);
        tokenList.push(_token);
        tokenToExchange[_token] = newExchange;
        exchangeToToken[newExchange] = _token;
        ExchangeLaunch(newExchange, _token);
        return newExchange;
    }

    function getExchangeCount() public view returns (uint exchangeCount) {
        return tokenList.length;
    }

    function tokenToExchangeLookup(address _token) public view returns (address exchange) {
        return tokenToExchange[_token];
    }

    function exchangeToTokenLookup(address _exchange) public view returns (address token) {
        return exchangeToToken[_exchange];
    }
}
