const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { network, config } = require("hardhat");

const networkAddressMapping = config.networkAddressMapping;

// check addressMapping has the network
if (!networkAddressMapping[network.name]) {
  throw new Error('network ' + network.name + ' dont config in the addressMapping, please add it');
}

const {
  lendingPoolAddressesProviderAddress,
  uniswapRouterAddress
} = networkAddressMapping[network.name];

module.exports = buildModule("AaveApePlus", (m) => {
  const aaveApePlus = m.contract("AaveApePlus", [lendingPoolAddressesProviderAddress, uniswapRouterAddress]);
  return { aaveApePlus };
});