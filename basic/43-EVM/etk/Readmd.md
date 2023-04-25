1. base token的字节码分析
https://gists.rawgit.com/ajsantander/23c032ec7a722890feed94d93dff574a/raw/a453b28077e9669d5b51f2dc6d93b539a76834b8/BasicToken.svg
https://blog.openzeppelin.com/deconstructing-a-solidity-contract-part-i-introduction-832efd2d7737/

2. etk工具使用
https://github.com/quilt/etk

3. 常见的assembly代码片段：

https://etherscan.io/address/0x99c9fc46f92e8a1c0dec1b1747d010903e884be1#code
3.1. proxy delegatecall
```js
function _doProxyCall()
        onlyWhenNotPaused
        internal
    {
        address implementation = _getImplementation();

        require(
            implementation != address(0),
            "L1ChugSplashProxy: implementation is not set yet"
        );

        assembly {
            // Copy calldata into memory at 0x0....calldatasize.
            calldatacopy(0x0, 0x0, calldatasize())

            // Perform the delegatecall, make sure to pass all available gas.
            let success := delegatecall(gas(), implementation, 0x0, calldatasize(), 0x0, 0x0)

            // Copy returndata into memory at 0x0....returndatasize. Note that this *will*
            // overwrite the calldata that we just copied into memory but that doesn't really
            // matter because we'll be returning in a second anyway.
            returndatacopy(0x0, 0x0, returndatasize())
            
            // Success == 0 means a revert. We'll revert too and pass the data up.
            if iszero(success) {
                revert(0x0, returndatasize())
            }

            // Otherwise we'll just return and pass the data up.
            return(0x0, returndatasize())
        }
    }
```
3.2. OP magic prefix
```js
bytes13 constant internal DEPLOY_CODE_PREFIX = 0x600D380380600D6000396000f3;
function setCode(
        bytes memory _code
    )
        proxyCallIfNotOwner
        public
    {
        // Get the code hash of the current implementation.
        address implementation = _getImplementation();

        // If the code hash matches the new implementation then we return early.
        if (keccak256(_code) == _getAccountCodeHash(implementation)) {
            return;
        }

        // Create the deploycode by appending the magic prefix.
        bytes memory deploycode = abi.encodePacked(
            DEPLOY_CODE_PREFIX,
            _code
        );

        // Deploy the code and set the new implementation address.
        address newImplementation;
        assembly {
            newImplementation := create(0x0, add(deploycode, 0x20), mload(deploycode))
        }

        // Check that the code was actually deployed correctly. I'm not sure if you can ever
        // actually fail this check. Should only happen if the contract creation from above runs
        // out of gas but this parent execution thread does NOT run out of gas. Seems like we
        // should be doing this check anyway though.
        require(
            _getAccountCodeHash(newImplementation) == keccak256(_code),
            "L1ChugSplashProxy: code was not correctly deployed."
        );

        _setImplementation(newImplementation);
    }
```
```js
push1 0x0d      0x0d
codesize        codesize 0x0d
sub             runtimesize
dup1            runtimesize runtimesize
push1 0x0d      0x0d runtimesize runtimesize
push1 0x00      0x00 0x0d runtimesize runtimesize
codecopy        runtimesize
push1 0x00      0x00 runtimesize
return
```

4. evm.codes
https://evm.codes/