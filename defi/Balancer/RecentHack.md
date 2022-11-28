# Ref
https://forum.balancer.fi/t/medium-severity-bug-found/3161

# Ana
Double entry point token
SNX: https://etherscan.io/address/0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f#code
sBTC: https://etherscan.io/address/0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6#code => synthetics

the key drawback is :
简单来讲就是，既可以通过Proxy合约地址来进行transfer，也可以通过Impl合约地址来transfer。因为合约的状态没有存放在proxy里面，而是存放在Impl里面。这种token类似于TUSD，可以对COMP的仿盘造成很大的伤害。现在来看，也会导致balancer出现问题。
```js
// Proxy:
function transfer(address to, uint256 value) public returns (bool) {
        // Mutable state call requires the proxy to tell the target who the msg.sender is.
        target.setMessageSender(msg.sender);

        // Forward the ERC20 call to the target contract
        IERC20(target).transfer(to, value);

        // Event emitting will occur via Synthetix.Proxy._emit()
        return true;
    }
//Impl: 
function transfer(address to, uint value) external optionalProxy systemActive returns (bool) {
        // Ensure they're not trying to exceed their locked amount -- only if they have debt.
        _canTransfer(messageSender, value);

        // Perform the transfer: if there is a problem an exception will be thrown in this call.
        _transferByProxy(messageSender, to, value);

        return true;
    }
modifier optionalProxy {
        _optionalProxy();
        _;
    }
function _optionalProxy() private {
        if (Proxy(msg.sender) != proxy && messageSender != msg.sender) {
            messageSender = msg.sender;
        }
    }
```
这里主要是要熟悉一下Balancer的Flashloan机制。目前Balancer的flashloan也是免费的！手续费为0；
https://docs.balancer.fi/concepts/features/flash-loans,需要sorted tokens！！

DOUBLE ENTRY POINT的TOKEN到底意味着什么？
它的balanceOf很像msg.vaule的感觉。