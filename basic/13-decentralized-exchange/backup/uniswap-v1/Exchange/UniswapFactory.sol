pragma solidity ^0.4.20;
// 引入子合约
import './UniswapExchange.sol';

// 定义工厂合约接口
contract FactoryInterface {
    // uniswap中现有的代币地址数组
    address[] public tokenList;
    // 设置a代币地址和a代币流动性池子地址的映射
    mapping(address => address) tokenToExchange;
    // 设置a代币流动性池子地址和a代币地址的映射
    mapping(address => address) exchangeToToken;

    // 启动一个新的流动性池子(new一个新的子合约)
    function launchExchange(address _token) public returns (address exchange);

    // 返回当前可用的流动性池子数量
    function getExchangeCount() public view returns (uint256 exchangeCount);

    // 使用代币地址找出其对应的代币交易对地址
    function tokenToExchangeLookup(address _token) public view returns (address exchange);

    // 使用代币交易对地址找出其对应的代币地址
    function exchangeToTokenLookup(address _exchange) public view returns (address token);

    // 新的交易对合约生成事件
    event ExchangeLaunch(address indexed exchange, address indexed token);
}

// UniswapFactory继承自FactoryInterface
contract UniswapFactory is FactoryInterface {
    // 新的交易对合约生成事件
    event ExchangeLaunch(address indexed exchange, address indexed token);

    // index of tokens with registered exchanges
    // uniswap中现有的代币地址数组
    address[] public tokenList;
    // 设置a代币地址和a代币流动性池子地址的映射
    mapping(address => address) tokenToExchange;
    // 设置a代币流动性池子地址和a代币地址的映射
    mapping(address => address) exchangeToToken;

    // 启动一个新的流动性交易对,并返回该交易对的合约地址
    function launchExchange(address _token) public returns (address exchange) {
        //There can only be one exchange per token
        // 每种代币只能有一个eth交易对合约
        require(tokenToExchange[_token] == address(0));
        // 代币不能是0地址,且代币地址不能等于当前合约地址
        require(_token != address(0) && _token != address(this));
        // 传入代币地址,生成一个新的合约
        UniswapExchange newExchange = new UniswapExchange(_token);
        // 在现有的代币数组中增加刚生成代币地址
        tokenList.push(_token);
        // 增加新代币地址和新合约地址的映射
        tokenToExchange[_token] = newExchange;
        // 增加新合约地址和新代币地址的映射
        exchangeToToken[newExchange] = _token;
        // 记录新交易对生成事件
        ExchangeLaunch(newExchange, _token);
        // 返回新合约地址
        return newExchange;
    }

    // 获取现有交易对数量
    function getExchangeCount() public view returns (uint256 exchangeCount) {
        return tokenList.length;
    }

    // 根据代币地址返回在交易所中该代币交易对地址
    function tokenToExchangeLookup(address _token) public view returns (address exchange) {
        return tokenToExchange[_token];
    }

    // 根据代币交易对地址返回该代币地址
    function exchangeToTokenLookup(address _exchange) public view returns (address token) {
        return exchangeToToken[_exchange];
    }
}
