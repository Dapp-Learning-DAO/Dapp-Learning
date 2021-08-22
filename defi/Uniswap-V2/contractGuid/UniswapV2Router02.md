## UniswapV2Router02.sol
https://etherscan.io/address/0x7a250d5630b4cf539739df2c5dacb4c659f2488d#code

路由是面向用户提供的一系列操作方法
路由中主要是
- library
- 添加/移除流动性
- 交换方法

## UniswapV2Library

```
library UniswapV2Library {
    using SafeMath for uint;

    ////两个token排序，address实际也是一个uint160，可以相互转换，所以可以比大小，排序,小是0，确认在交易对中的token0,token1
    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }
    // 通过create2的方式计算交易对的地址，注意initCode,每次部署的时候，可能都不一样，需要生成
    //用法套格式即可，对应factory中的createPair， 要深入的，可以具体去了解下create2
    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
            ))));
    }
    //获取两个币的储备量， 通过pair查询， 内部返回值会根据入参的币种进行调整位置返回
    // fetches and sorts the reserves for a pair
    function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pairFor(factory, tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // 添加流动性的时候，通过该方法查询输入A的数量，需要多少个B
    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        ////判断数量， 首次添加流动性，随意定价，不需要查询该方法
        require(amountA > 0, 'UniswapV2Library: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        //B数量 = 预期输入A的数量 * B的储备量 / A的储备量；  //实际公式就是 A/B = reserveA/reserveB, 两个币的数量比例一致
        amountB = amountA.mul(reserveB) / reserveA;
    }
    //通过精确输入金额,输入币的储备量，输出币的储备量，计算输出币的最大输出量
    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        //具体看下面的公式推导，要看该公式，首先要理解uniswap AMM, X * Y= K
        ////手续费都是扣输入额的千三，所以需要去掉千三后才是实际用于交易的金额
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);//套下面公式理解
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
        /*
        *   查看下面的由in计算out公式 out = in * f * rOut / rIn + in *f
        *   手续费是千三， 扣除手续费后去交易的金额是输入额的0.997, 公式中的f是0.997 内部计算用的uint,所以分子分母都 * 1000
        *   最终的公式是    out = in * 997 * rOut / ((rIn + in *f) * 1000)
        *                  out = in * 997 * rOut / (rIn*1000 + in * 997)
        */
    }
    /**
    *
    *
    * 推导公式
    * in 输入金额， out 输出金额
    * rIn tokenIn的流动性， rOut，tokenOut的流动性
    * fee 手续费，注：当前带入0.997   也就是997/1000
    *
    * 两个计算公式实际是一样的， 只是一个求in,一个求out
    * (rIn + in * f) * (rOut - out) = rIn * rOut
    *
    *
    * 由out计算in  getAmountIn
    *      (rIn + in * f) * (rOut - out) = rIn * rOut

    *      rIn * rOut + in * f * rOut  - rIn * out - in * f * out = rIn * rOut

    *      rIn * out = in * f * rOut - in * f * out

    *      in = rIn * out / (f * (rOut - out)) + 1  (尾部的 +1应该是避免精度计算，最后一位小了，会成交不了)
    *
    *
    * 由in计算out  getAmountOut 下面是公式转换过程，最终就简化成代码中的
    *      (rIn + in * f) * (rOut - out) = rIn * rOut

    *      rIn * rOut + in * f * rOut  - rIn * out - in * f * out = rIn * rOut

    *      in * f * rOut = rIn * out + in * f * out

    *      out = in * f * rOut / rIn + in * f
    *
    */
    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        //先看上面的由out计算in 公式推导
        //对应公式中的rIn * out, 乘以1000是0.997需要换算成整数
        uint numerator = reserveIn.mul(amountOut).mul(1000);
        //对应上面的分母 (f * (rOut - out)),乘以1000后就是 997 * (rOut - out)
        uint denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }
    // 根据path,计算出每个交易对的输入/输出量(如果path>2,前一个交易对的输出量，就是下一个交易对交易的输入量)
    //内部实际还是调用的上面getAmountOut方法， 返回值amounts长度和path的长度一致，
    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            //每两个token组成一个交易对，计算out
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }
     // 根据path,计算出每个交易对的输入/输出量(如果path>2,前一个交易对的输出量，就是下一个交易对交易的输入量)
    //内部实际还是调用的上面getAmountIn方法， 返回值amounts长度和path的长度一致，
    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {//倒序遍历计算
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}
```

## UniswapV2Router02

### 添加流动性
#### addLiquidity/addLiquidityETH
这两个的区别就是eth会内部帮转weth,再去添加流动性，多余的eth会返回给用户

```
    function addLiquidity(
        address tokenA,//代币地址A
        address tokenB,//代币地址B
        uint amountADesired,//代币A 期望添加量
        uint amountBDesired,//代币B 期望添加量
        uint amountAMin,//代币A 最小添加量(这两个min,首次添加的时候可以和Desired一样， 二次添加的时候，一般都是小于Desired，具体小多少，算法可以查看uniswap前端代码)
        uint amountBMin,//代币B 最小添加量
        address to,//lp接收人
        uint deadline//交易的成交时间，默认是当前时间+20分钟后的时间的秒值
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        //调用内部方法_addLiquidity 获取到两个币实际所需要的数量
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        //查找到pair地址
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        //给pair转A/B数量
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        //调用pair的mint方法，会有添加的lp数量返回
        liquidity = IUniswapV2Pair(pair).mint(to);
    }
```
#### _addLiquidity 添加流动性,内部方法计算添加流动性时两币种的数量

```
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        //通过factory,查询pair,如果等于0地址，就表示还没有该交易对，调用创建方法
        if (IUniswapV2Factory(factory).getPair(tokenA, tokenB) == address(0)) {
            IUniswapV2Factory(factory).createPair(tokenA, tokenB);
        }
         //如果查询两个值都是0，首次添加，直接使用期望值
        (uint reserveA, uint reserveB) = UniswapV2Library.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            //直接使用这两个值，比例就是相互的币价
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            //如果两个储备量不为0，需要根据当前的价格/比例去新增流动性
            //先通过quote计算如果输入A的数量，得出B的实际输入量
            uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
            //如果B的实际输入量<=B的期望输入数量，
            if (amountBOptimal <= amountBDesired) {
                //实际输入量需要大于等于参数中的最小数量
                require(amountBOptimal >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
                //得到两个的实际添加量
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                //如果上面计算的B的实际输入量大于期望输入量，就说明用户得B数量不够， 需要反过来，通过B计算A的数量， 看A的数量是否满足，
                //通过B计算A的数量
                uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
                //需要计算得来的A量小于等于A的预期输入量
                assert(amountAOptimal <= amountADesired);
                //且实际输入量，需要大于等于最小数量
                require(amountAOptimal >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
                //得到两个的实际添加量
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
```

###  移除流动性
#### removeLiquidity
该方法需要先将lp授权给router
```
    //移除流动性，该方法需要先将lp代币授权给路由合约，才能代扣lp
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,//移除lp的数量，  转入lp得另外两个币
        uint amountAMin,//A的最小输出量
        uint amountBMin,//B的最小输出量
        address to,//接收两个币的地址
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        //获取pair地址
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
        //将lp转到pair地址
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        //调用pair的burn方法， 内部会将两个币的数量转给to,返回值就是两个代币的输出数量
        (uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to);
        //通过排序确认两个amountA/B
        (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        //校验A/B的输出量需要小于参数中要求的最小量，否则交易失败
        require(amountA >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
    }
```
- removeLiquidityETH
- removeLiquidityWithPermit
- removeLiquidityETHWithPermit
以上3个remove内部还是调用removeLiquidity
带ETH的区别是，调用接收币是router,然后由路由将weth转换成eth,后将两笔币转发给用户
带Permit是EIP712 带签名信息，验证签名后，Premit里面会授权，将授权和移除在一个交易内完成

#### removeLiquidityETHSupportingFeeOnTransferTokens
#### removeLiquidityETHWithPermitSupportingFeeOnTransferTokens
这两个方法名带ETH ，调用removeLiquidity的时候，接收者是router,由路由再转给用户
这两个和removeLiquidityETH的区别是：
如果另外一个币种是转账扣手续费的币，比如移除的时候可以获取到100个

```
//amount0 假如是100
(uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to);
```
由于转账扣手续费，例10%，在pair->router的时候，实际router只得到90个
在removeLiquidityETH是直接只用amount0，即100，实际就不够了

```
TransferHelper.safeTransfer(token, to, amount0);
```
而removeLiquidityETHSupportingFeeOnTransferTokens的是router持有的余额

```
TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
```


### 交换
- swapExactTokensForTokens
- swapTokensForExactTokens

先说下这两种方法的区别， exact表示哪边的金额是精确的

swapExactTokensForTokens 是输入值精确，参数中会有个最小输出，作为交易限制，没有达到amountOutMin,交易失败
对应的查询金额方法  getAmountsOut(factory, amountIn, path)

swapTokensForExactTokens 是输出值精确，参数中会有一个amountInMax，购买精确输出时最大允许支付这个值，否则交易失败
对应的查询金额方法  getAmountsIn(factory, amountOut, path)

#### swapExactTokensForTokens

```
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
    //通过getAmountsOut获取整个path完整路径的输入/出量，下标0是用户实际输入额，最后一个位置是实际输出额
        amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
        //需要满足计算得来最终输出量大于等于最小输出金额
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        //先将amounts[0]入金额转入第一个pair!
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
        );
        //调用内部_swap方法
        _swap(amounts, path, to);
    }
```
- swapTokensForExactTokens
- swapExactETHForTokens
- swapTokensForExactETH
- swapExactTokensForETH
- swapETHForExactTokens

以上几个都差不多，带ETH的就是router帮忙把eth转weth后交换，或者router帮忙把weth转换eth后给用户

#### swapExactTokensForTokensSupportingFeeOnTransferTokens
支持带交易手续费币种
- swapExactETHForTokensSupportingFeeOnTransferTokens
- swapExactTokensForETHSupportingFeeOnTransferTokens

上面两个带eth,差别就是eth转换
注意支持手续费的都是输入币精确
```
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) {
        //将输入金额转到第一个pair地址
        TransferHelper.safeTransferFrom(
            path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
        );
        //查询to用户当前最终输出token的余额
        uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        //调用内部交易方法
        _swapSupportingFeeOnTransferTokens(path, to);
        //通过查询余额的方式，校验交易前后的余额差，大于等于最小输出！
        require(
            IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
        );
    }
```


#### _swap 内部方法
注意这个英文注释 需要先将amounts[0]转到第一个pair
```
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            //得到进/出token地址
            (address input, address output) = (path[i], path[i + 1]);
            //排序得到token0
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            //获取到out币种的输出量！
            uint amountOut = amounts[i + 1];
            //根据token0，input得到amount0需要out,还是amount1是out,; 注意其中之一一定是0，即入token的金额，不需要pair转出
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            //如果i小于path长度-2，就表示还需要继续交易，所以to是下一个交易对，如果一样就表示path结束了，to就是参数中的_to
            address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
            //调用pair的 swap方法，其中一个out是0，另一个是要转出的金额， 内部是转出输出量，并校验交易是否正确，更新储备量
            IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output)).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }
```

#### _swapSupportingFeeOnTransferTokens
支持转账时扣手续费
同样需要先将amounts[0]转到第一个pair
和_swap的区别就在这里，不是使用计算来的amounts[0]作为输入，而是通过查询pair余额再减去最后更新的储备量得到实际pair到账额！)

```
    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
        for (uint i; i < path.length - 1; i++) {
            //得到进/出token地址
            (address input, address output) = (path[i], path[i + 1]);
            //排序得到token0
            (address token0,) = UniswapV2Library.sortTokens(input, output);
            //获取pair
            IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output));
            uint amountInput;
            uint amountOutput;
            { // scope to avoid stack too deep errors 避免堆栈太深错误，用{}括部分临时变量
                //获取两个币的储备量
                (uint reserve0, uint reserve1,) = pair.getReserves();
                //根据input,token0 得出 inToken的储备量,outToken的储备量
                (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
                //查询交易对的inToken余额，减掉最后记录的储备量，就是交易对实际获取到的inToken数量，用实际额去和pair交互
                amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
                //通过实际得到的input量，计算实际会输出的out数量
                amountOutput = UniswapV2Library.getAmountOut(amountInput, reserveInput, reserveOutput);
            }
            //根据token0，input得到amount0需要out,还是amount1是out,; 注意其中之一一定是0，即入token的金额，不需要pair转出
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
             //如果i小于path长度-2，就表示还需要继续交易，所以to是下一个交易对，如果一样就表示path结束了，to就是参数中的_to
            address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
             //调用pair的 swap方法，其中一个out是0，另一个是要转出的金额， 内部是转出输出量，并校验交易是否正确，更新储备量
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
```
