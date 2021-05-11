# 私钥获取
为方便获取，在 sk.txt 中放入 ganache-cli 的私钥，然后代码自动从中读取

# 编译合约  
编译合约的主逻辑在 compile.js 中。需要注意的是，这里使用的 solc 版本为 0.8.0 ，如果使用其他的 solc 版本，需要修改对应的代码

# 部署合约   
在 deploy.js 中, 读取合约进行编译，然后从 sk.txt 中读取私钥，对交易进行签名发送

# 访问合约公用变量
在 get.js 中，直接获取 Incrementer.sol 合约中 number 公共变量进行输出展示

# 调用合约接口  
在 increment.js 中，调用 Incrementer.sol 合约中的 increment 接口，给公共变量 number 的值增加 3

# 参考文章
代码参考文章如下
https://docs.moonbeam.network/getting-started/local-node/deploy-contract/