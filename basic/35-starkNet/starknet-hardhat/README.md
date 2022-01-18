# starknet-hardhat-plugin

starknet 的 hardhat 插件使用

## starknet-dev-net

starknet 的本地测试网络

安装

```sh
pip3 install starknet-devnet
```

启动本地服务(localhost:5000)

```sh
starknet-devnet -p 5000
```

## usage

安装依赖

```sh
yarn install
```

设置 `starknet` 路径，即安装cairo环境的python venv路径

- `cairo.version` 和 `cairo.venv` 两个字段只能出现一个，若设置version，则需要手动编译合约
- `mocha.starknetNetwork` 设置为 alpha 将使用默认的starknet测试网配置 (alpha-goerli)，设置为devnet则需要本地运行starknet-dev-net作为本地测试网络

```ts
// hardhat.config.js
...
const config: HardhatUserConfig = {
  cairo: {
    // version: "0.6.2", // alternatively choose one of the two venv options below

    // uses (my-venv) defined by `python -m venv path/to/my-venv`
    venv: "path/to/my-venv" // <-- put your dir
    
    // uses the currently active Python environment (hopefully with available Starknet commands!) 
    // venv: "active"
  },
  networks: {
    devnet: {
      url: "http://localhost:5000"
    }
  },
  mocha: {
    starknetNetwork: "devnet"
    // starknetNetwork: "alpha"
  }
};
```

编译合约

```sh
yarn compile
```

运行测试文件

```sh
yarn test
```

或

```sh
npx hardhat test ./test/...
```

## to-do

- 使用hardhat部署到测试网，一直连接超时

## reference

- hardhat 插件 <https://github.com/Shard-Labs/starknet-hardhat-plugin>
- 插件使用示例 <https://github.com/Shard-Labs/starknet-hardhat-example>
- starkNet-dev-net <https://github.com/Shard-Labs/starknet-devnet>

