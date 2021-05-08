# 编译合约  
编译合约的主逻辑在 compile.js 中。需要注意的是，这里使用的 solc 版本为 0.8.0 ，如果使用其他的 solc 版本，需要修改对应的代码

# 部署合约   
部署合约的代码在 deploy.js 中， 对应的私钥,账户地址 在 ganache-cli 启动的时候，可以获取到，然后对应的修改代码。

# 访问合约公用变量
在 read_from_contract.js 中，填入在 "部署合约" 这一步中部署成功的合约地址，访问其中的公有变量

# 调用合约接口  
在 interact_with_contract.js 中，我们同样访问在 "部署合约" 这一步中部署成功的合约。我们调用 increment 接口，给 number 数值 +3。为了验证调用是否成功，可以继续执行 read_from_contract.js ，查看 number 数值是否变更成功。