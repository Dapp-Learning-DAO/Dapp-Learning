## UniswapV2Factory
https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Factory.sol

创建交易对， 查询遍历所有交易对信息

## createPair 创建交易对
创建交易对使用了create2，可以根据要创建的合约的字节码，随机值，部署合约的地址结合计算出合约地址
这里顺带提一下,create1->默认的发布交易创建合约是根据用户地址+交易nonce计算出合约地址的


```
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        //条件判断，两个token不为0地址，不可以相同地址
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        //tokenA/tokenB排序得token0/token1, address可以和uint160互转，所以可以排序
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        //得到UniswapV2Pair的字节码(可在remix编译页面按钮下 选中pair合约，再点下面的Bytecode复制，文本中的object字段的值就是字节码)
        使用create2创建合约(这没细究，套用格式，包括pairFor)
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        //使用create2创建合约(这没细究，套用格式，包括pairFor)
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        //调用pair的initialize对token0/token1进行初始化赋值
        IUniswapV2Pair(pair).initialize(token0, token1);
        //两个token正方向填充到mapping中，方便查找
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        //添加到allPairs列表中
        allPairs.push(pair);
        //合约创建事件
        emit PairCreated(token0, token1, pair, allPairs.length);
    }
    //针对init code hash说明  这个hash是由pair的字节码 keccak256得来的
    //每次使用remix部署的时候，可能会变，所以每次都取到bytecode/object中值进行keccak256,然后替换router中的pairFor中的code
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
            ))));
    }
```
## 设置管理员和手续费地址

```
    //设置该地址则开启手续费
    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }
    //设置新的管理员
    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
```

## 查询方法

```
    mapping(address => mapping(address => address)) public getPair;//通过两个代币查找交易对，如果不存在就返回0x0地址
    address[] public allPairs;//根据下标获取pair地址
    //查询pair列表长度
    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
```

