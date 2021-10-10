// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
// todo 
async function main() {
  let params;
  let paramsNew;
  let proxyAdminContract;
  let transparentUpgradeableProxyContract;
  
  let [alice] = await ethers.getSigners();

  // Deploy paramsContract
  let paramsContractFactory = await hre.ethers.getContractFactory('Params');
  params = await paramsContractFactory.deploy();
  await params.deployed();
  console.log("params contract address: ", params.address);


  // Deploy ProxyAdmin
  let proxyAdminContractFactory = await ethers.getContractFactory(
    'ProxyAdmin'
  );
  proxyAdminContract = await proxyAdminContractFactory.deploy();
  await proxyAdminContract.deployed();
  console.log("ProxyAdmin contract address: ", proxyAdminContract.address)

  // Deploy TransparentUpgradeableProxy
  let transparentUpgradeableProxyContractFactory = await ethers.getContractFactory(
    'TransparentUpgradeableProxy'
  );
  transparentUpgradeableProxyContract = await transparentUpgradeableProxyContractFactory.deploy(params.address, proxyAdminContract.address,"0x8129fc1c" );
  await transparentUpgradeableProxyContract.deployed();
  console.log("transparentUpgradeableProxy  contract address: ", transparentUpgradeableProxyContract.address)
 
  let paramsNewContractFactory = await ethers.getContractFactory('ParamsNew');
  paramsNew = await paramsNewContractFactory.deploy();
  await paramsNew.deployed();
  console.log("paramsNew contract address: ", paramsNew.address);

  let ABI = [
    "function SetUint256Param(string,uint256)"
];
let iface = new ethers.utils.Interface(ABI);
let data = iface.encodeFunctionData("SetUint256Param", [ "1", 2 ]);
console.log("data: ", data);
let tx = await alice.sendTransaction({to: transparentUpgradeableProxyContract.address, data: data});
const res = await tx.wait();
console.log("TX: ", tx);
// console.log(res.events);
// console.log("event: ", res.events[0].args[0],res.events[0].args[0]);

const value = await params.GetUint256Param("1");

console.log(value)
// expect(value.to.equal(1));


await proxyAdminContract.upgrade(transparentUpgradeableProxyContract.address,paramsNew.address );
  
let tx1 = await alice.sendTransaction({to: transparentUpgradeableProxyContract.address, data: data});
await tx.wait();
console.log("TX1: ", tx1);

const value1 = await paramsNew.GetUint256Param("1");
console.log(value1)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
