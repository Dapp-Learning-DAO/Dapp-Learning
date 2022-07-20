
# Damn Vulnerable DeFi Solution


This post collects my solution to [Damn Vulnerable DeFi](https://www.damnvulnerabledefi.xyz/index.html), an excellent DeFi vulnerabilities practice platform. It's really a good introduction for whom new to smart contract vulnerabilities. Compared to [Ethernaut](https://ethernaut.openzeppelin.com/), challenges here are more similar to real-world vulnerabilities, and the way we play it is more friendly. I also referred to  some other blogs when finishing these challenges, thanks to these authors. 



Before starting this series of challenges, I recommend you to learn UniswapV1 and UniswapV2. Not having any DeFi knowledge will make you struggle in basic concepts, and understanding these two protocols is almost enough for this practice. I strongly recommend two blogs where I learned these two protocols: 

[Programming DeFi: Uniswap.](https://jeiwan.net/posts/programming-defi-uniswap-1/)

 and 

[Programming DeFi: Uniswap V2.](https://jeiwan.net/posts/programming-defi-uniswapv2-1/)

The author of these two wonderful blogs also wrote another well-known blog:

[Building Blockchain in Go](https://jeiwan.net/posts/building-blockchain-in-go-part-1/).



Most details are omitted in this blog, and the full source code of my solution can be found [here](https://github.com/y1cunhui/damn-vulnerable-defi/tree/myanswer).

## 1. Unstoppable

The bug is in this line of `UnstoppableLender.sol`:

```solidity
assert(poolBalance == balanceBefore);
```

Although as the comment says, it's ensured by the `deposit` function; users can also send tokens to this contract directly without calling `deposit` and without triggering `fallback`(since it's ERC20 token). So the solution is simple, just transfer tokens directly to the pool:

```javascript
hacker = await this.token.connect(attacker);
await this.token.transfer(this.pool.address, INITIAL_ATTACKER_TOKEN_BALANCE);
```

## 2. Naive receiver

To drain the user's contract, we just need to flash loan `0 ether` each time:

```javascript
await this.pool.connect(attacker);
for (i=0;i<10;i++) {
    await this.pool.flashLoan(this.receiver.address, 0);
}
```

To wrap it in a single transaction, you can deploy an attacker contract and move the logic into the contract.



## 3. Truster

The main strange point is that, `target` and `borrowTo` can be different with `meg.sender`, which means that we can call arbitrary function on behalf of the pool. I choose to call the `approve` function of the token, and then I can call `transferFrom` to drain the pool.



## 4. Side entrance

It's not hard to find that, we can flash loan some money and then deposit it. After this operation, the balance keeps not changed so the flash loan can succeed, and our deposit increased.



## 5. The rewarder

This challenge is a bit complex, and we need some time to make it clear by reading the challenge js.(Reading test files is always a good way to understand how this protocol works!)

The bug is in the `distributeRewards` function of contract `TheRewardPool`. When a new round came, it should always distribute the rewards first, and then do the snapshot; but this wrong implementation get confused here. So we just need to flash loan some money and deposit them.



## 6.  Selfie

It's a bug in the governance system: one can flash loan a lot money to `hasEnoughVote` to execute arbitrary action.

Our attack can be splitted into 2 steps. First we flash loan enough money, queueAction, and return the money. After the delay, we can execute the action.



## 7. Compromised

It's a strange challenge somehow. We can get two private keys from the network flow, and use the private key to control the oracle to achieve our goal. But I'm wondering is there really private key information in the real-world network flow?



## 8. Puppet

It's a challenge based on Uniswap V1. If you're not familiar with it, I strongly recommend you to read the blog I mentioned at the beginning of this article or see the offcial documentation. Reading it's source code may be not a good idea since it's written with Vyper.



The bug is that, the pool compute the price simply from the division of balance, which can be easily manipulated by hacker. So we just need to manipulate the shallow liquidity pool in Uniswap and borrow at an unreasonable price.



## 9. Puppet V2

Similar to above, it's a challenge based on Uniswap V2, and if you're not familiar with it please read the blog I recommended or the official doc.



The bug is also similar to challenge 8, where the only difference is that you need to interact with Uniswap V2 functions. These two challenges tells us that, we need to use the TWAP(Time-weighted Average Price) as our oracle instead of the simple division result. For more info about TWAP, you can read the [official doc](https://docs.uniswap.org/protocol/V2/concepts/advanced-topics/pricing) or the [whitepaper](https://uniswap.org/whitepaper.pdf).



## 10. Free Rider

The bug is in the `buyMany` and `buyOne` function of the marketplace contract. When some one want to but many NFTs, each `buyOne` just check the `msg.value`. Which means you just need to pay once to buy many NFTs.



We just need to flash loan some money first, then offer and buy for some times to drain the marketplace.



## 11. backdoor

This is a really interesting challenge, and I find the way to solve it from other blogs. I'd like to describe it in my own way again.



First I'm not familiar with `Gnosis Safe`, so I cannot understand the code quickly. I just need to find what it wants me to do:

1. Every user do not have `beneficiary` identity in the end, which function in the `walletRegistry` could change this? ——>`proxyCreated`

2. With the comments, I know this function will be called in `GnosisSafeProxyFactory::createProxyWithCallback` ——> see this function.

3. With some basic knowledge of Uniswap, we know that `Factory` contract is something to create the real logic contract quickly. After reading the code, I know that it will call `initializer` of the real `Proxy` contract. Also, by the information of `walletRegistry`:
   
   ```solidity
   require(bytes4(initializer[:4]) == GnosisSafe.setup.selector, "Wrong initialization");
   ```
   
   I know I will call the `setup` function of the `GnosisSafe` contract via `GnosisSafeProxy`'s `delegatecall`

4. By reading the `setup` function, I find a strange parameter thanks to the comments:
   
   ```solidity
   /// @param fallbackHandler Handler for fallback calls to this contract
   ```
   
   This parameter is controlled by us! As a result, it's just a tranditional "controlled delegatecall address" vulnerability. What we want it to get its money, so we can just delegatecall the token contract to transfer token to attacker.

Full code can be seen in my github link at the beginning of this article. I really learned a lot in the way of finding this bug.



## 12. climber

Bug of this code is here:

```solidity
function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata dataElements,
        bytes32 salt
    ) external payable {
        require(targets.length > 0, "Must provide at least one target");
        require(targets.length == values.length);
        require(targets.length == dataElements.length);

        bytes32 id = getOperationId(targets, values, dataElements, salt);

        for (uint8 i = 0; i < targets.length; i++) {
            targets[i].functionCallWithValue(dataElements[i], values[i]);
        }
        
        require(getOperationState(id) == OperationState.ReadyForExecution);
        operations[id].executed = true;
    }
```

We notice that it first execute all the actions, and then check if it's ready for execution. Obviously it does not follow the [Checks Effects Interactions](https://fravoll.github.io/solidity-patterns/checks_effects_interactions.html) pattern in programming. Although it will not trigger re-entrancy vulnerability as most cases, we can execute something when it's not ready, and make it to be ready in the process of execution.



Since we want to call the sweep function of `vault`, and the `timelock` contract is just the owner of `vault`, we can try to upgrade the `vault` implementation and drain the vault. It's true, but I suffered a lot trouble in coding this idea. I always suffered some unexpected error, and it's difficult to debug and code because of the upgradeable pattern...

You can see my final solution in the github repo. I choose to transfer the ownership to my attacker contract address, and use `upgradeToAndCall` to finish the attack.





## Conclusion

Congratulations for finishing this series of challenges! You may feel that you learn a lot of DeFi knowledge and audition experience, as I did. 



Welcome candid criticism to all kinds of error(knowledge or grammar) in my article by github issue, or contact me with email. 

[Author's Personal website](https://y1cunhui.github.io/posts/Damn-Vulnerable-DeFi-Solution/)



## Reference

[write-up series on Damn Vulnerable DeFi V2](https://ventral.digital/posts/tag/Damn+Vulnerable+DeFi+v2)
[Damn Vulnerable DeFi Solutions](https://cmichel.io/damn-vulnerable-de-fi-solutions/)