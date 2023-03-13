# 说明
以目前0.8.17版本为例，介绍异常处理。

# 错误类型
异常分为错误和Panic，前者表达条件不符，后者表达程序错误。

- Error：通常指运行时条件不满足。发生后，会回退状态，和未使用的gas。它可以拆为：
    - Error(无信息)：不包含错误信息的错误，例如revert(), require(condition), eth不足，gas不足等。由于于没有错误信息，发生后很难去定位出原因。
    - Error(String)：包含错误信息的错误，例如revert("invalid condition"), require(condition, "invalid condition")等
    - CustomError：包含自定义错误信息，例如revert CustomError(xxx,xxx)..
- Panic：不该出现的错误，更多的和程序逻辑本身相关。发生后，仅回退状态，在0.8.0之前还会吞掉未使用的gas，因为0.8.0之前使用0xfe，之后则改为0xfd



# 抛出错误

| 抛错方法           | 异常类型                    | 编码方式               | EVM逻辑                                                     |
| ------------------ | --------------------------- | --------------------------- | ------------------------------------------------------------ |
| require(condition) | Error(无信息)                       | 0x                          | 回退状态，回退剩余gas                                       |
| require(condition, reason) | Error(String)        | 异常选择器+报错字符串 | 回退状态，回退剩余gas                                       |
| revert()           | Error(无信息)                   | 0x                          | 回退状态，回退剩余gas                                       |
| revert(reason)     | Error(String)               | 异常选择器+报错字符串        | 回退状态，回退剩余gas                                       |
| 转账无余额         | Error(无信息)                       | 0x                          | 回退状态，回退剩余gas                                       |
| gas不足             | Error(无信息)                       | 0x                          | 回退状态，回退剩余gas                                       |
| revert 自定义错误  | 自定义，如CustomError(uint256 a, uint256 b) | 异常选择器+自定义错误数据 | 回退状态，回退剩余gas                                       |
| assert(condition)  | Panic(uint256)              | 异常选择器+错误码0x01       | 回退状态,吞掉剩余(<0.8.0)                                                     |
| 算术溢出           | Panic(uint256)              | 异常选择器+错误码0x11       | 回退状态,吞掉剩余(<0.8.0)                                                  |
| 除零               | Panic(uint256)              | 异常选择器+错误数据0x12     | 回退状态,吞掉剩余(<0.8.0)                                                     |
| 数组越界           | Panic(uint256)              | 异常选择器+错误数据0x32     | 回退状态,吞掉剩余(<0.8.0)                                                    |
| ...                | ...                         | ...                         | ...                                                          |

更多panic对应的错误码，可以参阅[这里](https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require)。

## 异常编码
Error(无信息)，为空字符串。

Error(String), 自定义错误，Panic(uint256),这三类异常都按照“异常选择器 + 异常数据”的格式来编码。

例如，revert("Invalid input")的编码数据为：

```
0x08c379a
00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d496e76616c696420696e70757400000000000000000000000000000000000000

```

### 异常选择器
- Error(string): bytes4(keccak256("Error(string)"))
- 自定义错误，CustomError(uint256 code, address caller): bytes4(keccak256("CustomError(uint256,address)"))
- Panic(uint256): bytes4(keccak256("Panic(uint256)"))

### 异常数据
异常数据跟在异常选择器后面。对于异常数据，可以通过abi.decode解析出强类型的数据。例如对于一个Error(String)，可以这么解析：
```
bytes memory exceptionData = ...;

string memory reason = abi.decode(exceptionData, (string));

```

# 捕获异常
## try-catch方式
下面的方式可捕获上述4种错误：
```
contract CatchByTryCatch{


    function tryCatch() external{
        try CatchByTryCatch(address(this)).whatever() {
            //If this block throws, it would not be caught. 
        }
        catch(bytes memory exceptionData) {
            
        }
    }
    
    function whatever() public{
        //Throw Error With String
        revert("bad call");
        //Or Throw Error Without String like revert()
        //Or Throw Custom Error like revert CustomError(xxx,xxx..)
        //Or Panic like assert(condition)
    }
}
```
注意：
- try后面括号{}包起来的部分不在捕获范围，它用于表示调用成功后的处理逻辑，这块抛出的异常不会被处理。try-catch仅针对try后面的那个调用。
- catch捕获的是异常的编码数据，即前文介绍的编码后的错误。

### 捕获特定异常
可以选择捕获部分特定异常，但这个功能不完善。

#### 捕获Error(无信息)
不行
### 捕获Error(string)
需要在catch后面跟错误签名：
```
try ... {

}
catch Error(string memory reason){
    //Only catches Error(string)
}
catch (bytes memory otherException){
    //Exceptions other than Error(string)
}
```

### 捕获Panic(uint256)
需要在catch后面跟Panic签名：
```
try ... {

}
catch Panic(uint256 code){
    //Only catches Panic
}
catch (bytes memory otherException){
    //Exceptions other than Panic
}
```

#### 捕获自定义错误
既然Error(string), Panic(uint256)可以被捕获，是否也可以写成下面这样？不行，至少目前0.8.17不行, 编译不通过，这个问题还在[讨论中](https://github.com/ethereum/solidity/issues/13869):

```
       try ...{

        }
        catch CustomError(uint256 code, address caller, string memory reason){
            //编译过不了！
        }
        catch (bytes memory otherException){

        }
```

## 通过call/staticcall获取结果

对于call，staticcall这样的调用，它们有异常也不会报错，但可以通过返回值获取错误：
```
    function catchCall() external{
        (bool success, bytes memory returnData) = address(this).call(abi.encodeWithSignature("whatever()"));
        if (!success){
            //returnData now is error. handle it!
            //...
        }
    }

```
# 解析错误
前文提到，不同的错误，有不同的编码方式，例如最普通的Error是不会编码的。因此，可以遵循三部曲：
- 判断它的长度
- 提取异常选择器和异常数据
- 根据异常选择器，对异常数据进行解码
```
    function tryCatch() external{
        try ... {
        }
        catch(bytes memory exceptionData) {
            if (exceptionData.length < 68){
                //..
            } else{
                bytes4 exceptionSelector = bytes4(exceptionData);
                bytes memory payload = BytesLib.slice(exceptionData, 4, exceptionData.length-4);

                if (exceptionSelector == bytes4(keccak256("Error(string)"))){
                    string memory reason = abi.decode(payload, (string));
                    //reason is "bad call"
                    //..
                }
                if (exceptionSelector == bytes4(keccak256("CustomError(uint256,address,string)"))){
                    (uint256 code, address caller, string memory reason) = abi.decode(payload, (uint256, address, string));
                }
                if (exceptionSelector == bytes4(keccak256("Panic(uint256)"))){
                    uint256 code = abi.decode(payload, (uint256));
                }
            }
        }
    }

```

为了便于截取bytes，可以用这个库：https://github.com/GNSPS/solidity-bytes-utils
# 参考
https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require