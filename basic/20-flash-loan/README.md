[中文](./README-CN.md) / English

# Flashloans introduce  

What is a so-called flash loan? You can look at it as a bunch of operations that can be controlled by codes, as long as your all operations (including repayment) can be finished in a transaction, you can loan it unconditionally.

You can do a lot of things in a single transaction in the blockchain; not only one time transfer, but you can also do it even 50 times, because the smart contract is just like a computer program, when you start a transaction, it's equally you call some functions in some smart contract. You can call several functions in a transaction, so you can do a lot of operations as well.

As stated earlier, the flash loan requires that you need all your operations to be finished in a transaction(if you can't do it, then you can't loan). So you have to make sure you had programmed all the steps you can think about into one transaction; don't forget "loan, transfer(actions), repayment".

If you can't repay when the transaction closes, the transaction will fail as if nothing had happened.

For example, the flash loan has loaned you ten thousand eths, once you don't repay it at the end of the transaction, it will be like you have never loaned these eths, because when the node executes the transaction, and the transaction fails, all the actions in this transaction will be rolling back.

Amazing, right? If we don't execute all operations and return enough funds successfully, those ETHs are as if they haven't been used.

Well, we do think this is a kind of magic too, which is the latest invention on a Turing-complete network (a Turing-complete programming language + self-executing "accounts" or smart contracts).

All nodes running the Ethereum also run this flash loan smart contract. When the program (smart contract) is activated by the transaction on the chain, it is equal to the contract executing the operation specified by the transaction. If repayment can successfully be done, the contract will report "successful execution", and the state of the whole network will be changed; if the repayment can't be completed, the contract will report "failure", and the only changed status will be in the flash loan contract.

## steps   
Get into the sub folder of `aave, dydx, uniswapv2, uniswapv3`, follow the guides of the readme
 
## Reference link

- [A comparison of flash loans from Aave, dYdX and Uniswap](https://mp.weixin.qq.com/s/GSnb81C0vI6sgyrWpPqqwg)
- https://ethfans.org/posts/flash-loans-as-an-example-what-can-a-transaction-reach
- https://github.com/austintgriffith/scaffold-eth
- https://soliditydeveloper.com/eip-3156
- https://learnblockchain.cn/article/2856
- https://mp.weixin.qq.com/s/APAUeoPl2s-t0VIiP3IASA
