# 比特币地址生成脚本
这个项目包含一个常见的 JavaScript 脚本，用于生成不同类型的比特币地址，包括 Legacy、Nested Segwit、Native Segwit 和 Taproot 地址。它使用 bitcoinjs-lib 库和 ecpair 以及 tiny-secp256k1 模块来创建地址。

# 功能
生成四种类型的比特币地址：
- Legacy (P2PKH)
- Nested Segwit (P2SH-P2WPKH)
- Native Segwit (P2WPKH)
- Taproot (P2TR)

# 环境设置
安装 Node.js: 确保您的系统上安装了 Node.js。可以在 Node.js 官网下载并安装。

安装依赖: 项目依赖于 bitcoinjs-lib、ecpair 和 tiny-secp256k1。可以通过运行以下命令来安装这些依赖项：

```js
npm install bitcoinjs-lib ecpair tiny-secp256k1
```
# 运行脚本
在安装所有依赖后，您可以运行脚本来生成比特币地址。使用以下命令来运行脚本：

```js
node <脚本文件名>.js
```
替换 <脚本文件名> 为您的 JavaScript 文件名。

# 输出
脚本将在控制台中输出以下格式的地址：

```js
Legacy Address: 18RKdzEVDe6oCxrdeiipZGtKYWxTXmaxh3
Nested Segwit Address: 385Q6vxTS5My1rZ7vs6jSonuQDB987o2p2
Native Segwit Address: bc1qxwy6vyfedw67sdr754avqcgrnw9sfpzuqgde4d
Taproot Address: bc1pvc3cpr6c2eejzylks2cg9vhanqepk3hmd0ssn8etzmf2r7y4q40q77ljsl
```

生成的地址仅用于演示和教育目的。在生产环境中使用时，请确保理解相关的安全风险。
Taproot 地址的支持可能取决于 bitcoinjs-lib 的版本。
