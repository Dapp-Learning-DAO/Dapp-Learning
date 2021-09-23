const { expect } = require('chai');

describe('proxy contract', function () {
  let params;
  let paramsNew;
  let proxyAdminContract;
  let transparentUpgradeableProxyContract;

  let alice;

  beforeEach(async function () {
    [alice] = await ethers.getSigners();

    // Deploy paramsContract
    let paramsContractFactory = await ethers.getContractFactory('Params');
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

 

  });

  it('upgrade to paramsNew', async function () {

    // reverted with reason string : Ownable: caller is not the owner
    // await params.SetUint256Param("1",1);
    //  console.log(await params.GetUint256Param("1"));

    // Deploy new paramsContract
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
    // Check 
// expect(value.to.equal(2));
  });

  
});
