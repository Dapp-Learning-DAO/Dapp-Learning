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
    //initialize，本方法对应的code为 0x8129fc1c
    transparentUpgradeableProxyContract = await transparentUpgradeableProxyContractFactory.deploy(params.address, proxyAdminContract.address,"0x8129fc1c" );
    await transparentUpgradeableProxyContract.deployed();
    console.log("transparentUpgradeableProxy  contract address: ", transparentUpgradeableProxyContract.address)

    console.log( await proxyAdminContract.getProxyAdmin(transparentUpgradeableProxyContract.address));



     
   
 

  });

  it('upgrade to paramsNew', async function () {

    // reverted with reason string : Ownable: caller is not the owner
    // await params.SetUint256Param("1",1);
    // console.log(await params.GetUint256Param("1"));

    // Deploy new paramsContract
    let paramsNewContractFactory = await ethers.getContractFactory('ParamsNew');
    paramsNew = await paramsNewContractFactory.deploy();
    await paramsNew.deployed();
    console.log("paramsNew contract address: ", paramsNew.address);

    let ABI = [
      "function SetUint256Param(string,uint256)",
      "function GetUint256Param(string)"
  ];
  let iface = new ethers.utils.Interface(ABI);
  let data = iface.encodeFunctionData("SetUint256Param", [ "1", 2 ]);
  let dataGet = iface.encodeFunctionData("GetUint256Param", [ "1" ]);

  let tx = await alice.sendTransaction({to: transparentUpgradeableProxyContract.address, data: data});
  const getTransactionReceipt= await tx.wait();
  
  let eventabi = [ "event Uint256ParamSetted(string indexed _key,uint256 _value);" ];
  let iface1 = new ethers.utils.Interface(eventabi);
  let log = iface1.parseLog(getTransactionReceipt.logs[0]);

  console.log("log: ", log.args);

  // just some check 
  const value = await params.GetUint256Param("1");
  console.log(value)

  // upgrade before 
  let resultBefore = await alice.call({to: transparentUpgradeableProxyContract.address, data: dataGet});
  expect(resultBefore).to.equal('0x0000000000000000000000000000000000000000000000000000000000000002');

  
  let txUpgrade = await proxyAdminContract.upgrade(transparentUpgradeableProxyContract.address,paramsNew.address );
  let txUpgradeReceipt = await txUpgrade.wait();
  console.log("tx: ",txUpgradeReceipt)


  let result = await alice.call({to: transparentUpgradeableProxyContract.address, data: dataGet});
  expect(result).to.equal('0x0000000000000000000000000000000000000000000000000000000000000003');
  // more elegant way
  const paramsNewWithProxy = await paramsNew.attach(transparentUpgradeableProxyContract.address)
  let result1 = await paramsNewWithProxy.GetUint256Param("1");
  console.log("result1:", result1);
  expect(result1).to.equal(3);

  let tx1 = await alice.sendTransaction({to: transparentUpgradeableProxyContract.address, data: data});
  const getTransactionReceipt1 = await tx1.wait();

  let log1 = iface1.parseLog(getTransactionReceipt1.logs[0]);


  //not change 
  const value1 = await paramsNew.GetUint256Param("1");
  console.log(value1)



   // change admin
   let txxx = await proxyAdminContract.transferOwnership(alice.address);
   //console.log(await txxx.wait());



  });

  
});
