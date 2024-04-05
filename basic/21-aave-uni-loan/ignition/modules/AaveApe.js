const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

let maticConfig = {
  lendingPoolAddressesProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
  //uniswap
  uniswapRouterAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564"
}

let contractParams = maticConfig;

module.exports = buildModule("AaveApe", (m) => {
  const lendingPoolAddressesProviderAddress = m.getParameter("lendingPoolAddressesProvider", contractParams.lendingPoolAddressesProvider);
  const uniswapRouterAddress = m.getParameter("uniswapRouterAddress", contractParams.uniswapRouterAddress);
  
  const aaveApe = m.contract("AaveApe", [lendingPoolAddressesProviderAddress, uniswapRouterAddress]);
  return { aaveApe };
});