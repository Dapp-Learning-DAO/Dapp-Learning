# 介绍  
SushiToken 是 SushiSwap 的治理代币，SushiSwap允许用户通过staking UniswapV2上的主流LP token，挖出治理代币SUSHI。每个区块发行100个SUSHI，这些代币将被均匀部署在所有13个池中，前两周(2020.08.29——2020.09.12)，每个区块可获得1000 SUSHI，而SUSHI/ETH池将获得200枚SUSHI。SUSHI代币没有实用价值，只拥有治理权，同时SUSHI代币持有人将分享0.05%的交易费。
[Ether scan](https://etherscan.io/address/0x6b3595068778dd592e39a122f4f5a5cf09c90fe2#code) 上可以查看 SushiToken 的具体代码.   

## 合约分析  
SushiToken 合约借鉴了 YAM && COMPOUND 这两个项目的代码，在其代码注释中，明确标注了其代码借鉴的原始项目。 
合约集成了 ERC20 功能，同时新增了投票代理的功能。

- delegateBySig   
使用 ECDSA 算法，恢复出签名者后把签名者的投票委托代理给代理者
```solidity
/**
     * @notice Delegates votes from signatory to `delegatee`
     * @param delegatee The address to delegate votes to
     * @param nonce The contract state required to match the signature
     * @param expiry The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
function delegateBySig(
        address delegatee,
        uint nonce,
        uint expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        external
    {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name())),
                getChainId(),
                address(this)
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                DELEGATION_TYPEHASH,
                delegatee,
                nonce,
                expiry
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                domainSeparator,
                structHash
            )
        );

        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "SUSHI::delegateBySig: invalid signature");
        require(nonce == nonces[signatory]++, "SUSHI::delegateBySig: invalid nonce");
        require(now <= expiry, "SUSHI::delegateBySig: signature expired");
        return _delegate(signatory, delegatee);
    }
```

- _delegate  
投票代理的核心函数，其中输入的参数 delegator 为被代理人，delegatee 为委托的代理人。 
观察 _delegate 函数，可以发现它会获取 delegator 当前的 SUSHI 余额，用此余额来更新 delegatee 的投票权重，在这里处理过程中会有个权重增值的问题。 
比如用户 A 当前有 100 SUSHI， 用户 A 授权用户 B 进行代理后，用户 B 拥有的投票权重为 100 。之后用户 A transfer 50 SUSHI 给用户 C ，然后用户 A 授权用户 D 进行代理投票，那么此时用户 B 拥有 50 的投票权重，用户 D 拥有 50 的投票权重。如果用户 C 把自己的投票代理给 B, 那么 B 拥有的投票权重为 100， 用户 D 拥有的投票权重为 50。  
可以看到，通过这样的操作，原本只有 100 的投票权重变为了 150，变相实现了投票权重的增值。  

```solidity
function _delegate(address delegator, address delegatee)
        internal
    {
        address currentDelegate = _delegates[delegator];
        uint256 delegatorBalance = balanceOf(delegator); // balance of underlying SUSHIs (not scaled);
        _delegates[delegator] = delegatee;

        emit DelegateChanged(delegator, currentDelegate, delegatee);

        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }

    function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                // decrease old representative
                uint32 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
                uint256 srcRepNew = srcRepOld.sub(amount);
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }

            if (dstRep != address(0)) {
                // increase new representative
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
                uint256 dstRepNew = dstRepOld.add(amount);
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

```

## 参考链接  
- 官网说明: https://docs.sushi.com/products/yield-farming 