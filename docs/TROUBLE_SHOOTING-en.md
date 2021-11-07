## Common problem

- When installing front-end dependencies, If NPM or YARN is changed to a domestic source, Still a similar ` getaddrinfo ENOENT raw.githubusercontent.com ` error, consider setting up a proxy for it：

    ```shell
    npm config set proxy http://username:password@server:port
    npm config set https-proxy http://username:password@server:port
    ```

    For example：(To set the proxy for YARN, replace the NPM with YARN and the port with the port of the local proxy.)

    ```shell
    npm config set proxy http://127.0.0.1:2802
    npm config set https-proxy http://127.0.0.1:2802
    ```

- **Request for test currency testnet**

- Rinkeby [Apply for Rinkeby test currenc](https://faucet.rinkeby.io/)
- Kovan [Apply for Kovan test currency1](https://linkfaucet.protofire.io/kovan) [Apply for Kovan test currency2](https://faucet.kovan.network)
- Ropsten [Apply for Ropsten test currency1](https://faucet.metamask.io/)
