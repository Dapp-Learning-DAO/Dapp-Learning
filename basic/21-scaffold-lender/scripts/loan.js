require("@nomiclabs/hardhat-waffle");
const { use, expect } = require("chai");


//https://docs.aave.com/developers/v/2.0/deployed-contracts/matic-polygon-market
let daiAddress = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
let wethAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
let usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"

let lendingPoolAddressesProviderAddress = "0xd05e3E715d945B59290df0ae8eF85c1BdB684744"
//sushi
let uniswapRouterAddress = "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506"

let wethGatewayAddress = "0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97"

const aaveApeAddress = "0x914d9b89F31786DD925c8D6033FE963062a46799"


const depositEthInAave = async (pooladdress, _userAddress, _amount) => {

  const ethGateway = await ethers.getContractAt('WETHGateway', wethGatewayAddress)
  let metadata = {
    value: ethers.utils.parseEther(_amount)
  }
  let ethDeposit = await ethGateway.depositETH(pooladdress, _userAddress, 0,metadata);
  console.log(ethDeposit);
}

const getLendingPool = async () => {

  const lendingPoolAddressesProvider = await ethers.getContractAt('ILendingPoolAddressesProvider', lendingPoolAddressesProviderAddress)
  let lendingPoolAddress = await lendingPoolAddressesProvider['getLendingPool']()
  let lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress)

  return lendingPool
}

const getAToken = async (_asset) => {

  let lendingPool = await getLendingPool()
  let assetReserveData = await lendingPool['getReserveData'](_asset)
  let assetAToken = await ethers.getContractAt('IAToken', assetReserveData.aTokenAddress)

  return assetAToken
}

const getDebtToken = async (_asset, _interestRateMode, erc20=false) => {

  let lendingPool = await getLendingPool()

  let assetReserveData = await lendingPool['getReserveData'](_asset)
  let assetDebtToken

  if(_interestRateMode === 1) {
    let interface = erc20===true?'IERC20':'IStableDebtToken'
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.stableDebtTokenAddress)
  } else {
    let interface = erc20===true?'IERC20':'IVariableDebtToken'
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.variableDebtTokenAddress)
  }

  return assetDebtToken
}

const delegateCreditToTheApe = async (_asset, _interestRateMode = 2) => {

  let assetDebtToken = await getDebtToken(_asset, _interestRateMode)
  console.log("assetDebtToken: ", assetDebtToken.address);
  let assetDebtApproval = await assetDebtToken['approveDelegation'](aaveApeAddress, ethers.constants.MaxUint256)
   console.log("assetDebtApproval successfully  " );
}

   
main = async () => {
  const [deployer] = await ethers.getSigners();
  const aaveApe = await ethers.getContractAt("AaveApe",aaveApeAddress)
  
  
    // let poolAddress = await aaveApe.LENDING_POOL();
    // console.log("lendingpool: ", poolAddress)
      let interestRateMode = 2

     await depositEthInAave(poolAddress, deployer.address, "0.1")
      await delegateCreditToTheApe(daiAddress, interestRateMode)
      let result = await aaveApe.getAvailableBorrowInAsset(daiAddress, aaveApeAddress)
      console.log("available borrow: ", result)
      console.log("begin ape")
      await aaveApe['ape'](wethAddress, daiAddress, interestRateMode)

      let aToken = await getAToken(wethAddress)
      console.log("aToken: ", aToken)
      let debtToken = await getDebtToken(daiAddress, interestRateMode, true)
      console.log("debtToken: ", debtToken)
      await aToken.approve(aaveApe.address, ethers.constants.MaxUint256)

      let aBalanceBefore = await aToken.balanceOf(userAddress)
      let debtBalanceBefore = await debtToken.balanceOf(userAddress)

      await expect(aaveApe['unwindApe'](wethAddress, daiAddress, interestRateMode)).to.emit(aaveApe, 'Ape');

      let aBalanceAfter = await aToken.balanceOf(userAddress)
      let debtBalanceAfter = await debtToken.balanceOf(userAddress)

      expect(aBalanceAfter < aBalanceBefore)
      expect(debtBalanceAfter === 0)

}


      main()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });