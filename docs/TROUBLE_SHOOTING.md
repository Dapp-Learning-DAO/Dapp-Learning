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

- **测试币申请 testnet**

- Rinkeby [申请 Rinkeby 测试币](https://faucet.rinkeby.io/)
- Kovan [申请 Kovan 测试币1](https://linkfaucet.protofire.io/kovan) [申请 Kovan 测试币2](https://faucet.kovan.network)
- Ropsten [申请 Ropsten 测试币](https://faucet.metamask.io/)
