中文 / [English](https://github.com/rebase-network/Dapp-Learning/blob/main/docs/TROUBLE_SHOOTING-en.md)

## 常见问题

- 安装前端依赖时，如果在 npm 或者 yarn 修改为国内源之后，依旧出现类似 `getaddrinfo ENOENT raw.githubusercontent.com` 的报错，可以考虑为其设置代理：

    ```shell
    npm config set proxy http://username:password@server:port
    npm config set https-proxy http://username:password@server:port
    ```

    例如：（要为yarn设置代理将其中的npm替换为yarn即可，端口需要替换为本地代理的端口）

    ```shell
    npm config set proxy http://127.0.0.1:2802
    npm config set https-proxy http://127.0.0.1:2802
    ```

- Cannot read property 'toHexString'  
执行测试脚本时, 报类似如下的错误, 说明没有正确配置私钥, 需要重命名 .env.example 文件为 .env 文件, 然后在 .env 文件中配置私钥

```shell
TypeError: Cannot read property 'toHexString' of undefined
    at isHexable (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/bytes/lib/index.js:9:21)
    at hexlify (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/bytes/lib/index.js:175:9)
    at new SigningKey (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/signing-key/lib/index.js:20:82)
    at new Wallet (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/node_modules/@ethersproject/wallet/lib/index.js:123:36)
    at Object.<anonymous> (/Users/jolycao/Dapp-Learning/basic/05-ethersjs-erc20/index.js:39:14)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
    at Module.load (internal/modules/cjs/loader.js:950:32)
    at Function.Module._load (internal/modules/cjs/loader.js:790:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:76:12)
```

- **测试币申请 testnet**  

- Rinkeby [申请 Rinkeby 测试币](https://faucet.rinkeby.io/)
- Kovan [申请 Kovan 测试币1](https://linkfaucet.protofire.io/kovan) [申请 Kovan 测试币2](https://faucet.kovan.network)
- Ropsten [申请 Ropsten 测试币](https://faucet.metamask.io/)
