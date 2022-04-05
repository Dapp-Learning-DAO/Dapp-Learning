require('@nomiclabs/hardhat-waffle');
const { BigNumber } = require('@ethersproject/bignumber');
const axios = require('axios')
require("dotenv").config();

let exp = BigNumber.from("10").pow(18);
let exp1 = BigNumber.from("10").pow(27);

// matic address
//https://docs.aave.com/developers/v/2.0/deployed-contracts/matic-polygon-market
let daiAddress = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
let wmaticAddress = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'; //wmatic
 let wethAddress = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; //weth
 let wbtcAddress = '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'; //weth
let usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let lendingPoolAddressesProviderAddress = '0xd05e3E715d945B59290df0ae8eF85c1BdB684744';

//sushi
let uniswapRouterAddress = '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506';

let wethGatewayAddress = '0xbEadf48d62aCC944a06EEaE0A9054A90E5A7dc97';

// Fill in your address
const aaveApeAddress = '0xddb2d92d5a0EDcb03c013322c7BAe92734AA4597';


const getAToken = async (_asset) => {
  let lendingPool = await getLendingPool();
  let assetReserveData = await lendingPool['getReserveData'](_asset);
  let assetAToken = await ethers.getContractAt('IAToken', assetReserveData.aTokenAddress);

  return assetAToken;
};

const getLendingPool = async () => {
  const lendingPoolAddressesProvider = await ethers.getContractAt('ILendingPoolAddressesProvider', lendingPoolAddressesProviderAddress);
  let lendingPoolAddress = await lendingPoolAddressesProvider['getLendingPool']();
  let lendingPool = await ethers.getContractAt('ILendingPool', lendingPoolAddress);

  return lendingPool;
};

const getDebtToken = async (_asset, _interestRateMode, erc20 = false) => {
  let lendingPool = await getLendingPool();

  let assetReserveData = await lendingPool['getReserveData'](_asset);
  let assetDebtToken;

  if (_interestRateMode === 1) {
    let interface = erc20 === true ? 'IERC20' : 'IStableDebtToken';
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.stableDebtTokenAddress);
  } else {
    let interface = erc20 === true ? 'IERC20' : 'IVariableDebtToken';
    assetDebtToken = await ethers.getContractAt(interface, assetReserveData.variableDebtTokenAddress);
  }

  return assetDebtToken;
};


const getCurrentDebt = async (debtToken,userAddress) => { 
  return await debtToken.balanceOf(userAddress);
};


const querySql = `
        query($id: String!){
        users (where: {id: $id}) {
            borrowHistory (orderBy: timestamp) { 
                amount 
                reserve{
                    symbol
                    decimals
                    underlyingAsset
                    vToken{
                        id
                    }
                }
                userReserve{
                    currentTotalDebt
                }
                
            }

            repayHistory (orderBy: timestamp){ 
                amount 
                reserve{
                    symbol
                    decimals
                }
            }
        }
        }
      `


const url = {
  matic: 'https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic',
  mainnet: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v2',
}

const getInterest = async (url, graphQuery,variables,interestRateMode) => { 
  let axiosResult = await axios.post(url, {
    query: graphQuery,
    variables
  })

  let users = axiosResult.data.data.users[0]
  // 遍历 borrow 记录
  total_borrow = {}
  for(index in users.borrowHistory){
    let borrowRecord = users.borrowHistory[index]
    let symbol = borrowRecord["reserve"]["symbol"]
    let decimals = borrowRecord["reserve"]["decimals"]
    let vToken = borrowRecord["reserve"]["vToken"]["id"]
    let underlyingAsset = borrowRecord["reserve"]["underlyingAsset"]
    let currentTotalDebt = borrowRecord["userReserve"]["currentTotalDebt"]

    if(!total_borrow[symbol]){
      total_borrow[symbol] = {"amount": 0}
    }

    if(!total_borrow[symbol]["decimals"]){
      total_borrow[symbol]["decimals"] = decimals
    }

    if(!total_borrow[symbol]["vToken"]){
      total_borrow[symbol]["vToken"] = vToken
    }

    if(!total_borrow[symbol]["underlyingAsset"]){
      total_borrow[symbol]["underlyingAsset"] = underlyingAsset
    }
     
    if(!total_borrow[symbol]["currentTotalDebt"]){
      total_borrow[symbol]["currentTotalDebt"] = currentTotalDebt
    }

    total_borrow[symbol]["amount"] += parseInt(borrowRecord['amount'])
  }

  // 遍历 repay 记录
  let total_repay = {}
  for(index in users.repayHistory){
    let repayRecord = users.repayHistory[index]
    let symbol = repayRecord["reserve"]["symbol"]
    
    if(!total_repay[symbol]){
      total_repay[symbol] = {"amount": 0}
    }

    total_repay[symbol]["amount"] += parseInt(repayRecord['amount'])
  }
  

  // 计算 interest
  tota_interest = {}
  for(const symbol of Object.keys(total_borrow)){
      let currentDebt = 0
      if(total_borrow[symbol]["currentTotalDebt"] != 0){
        let currentDebtToken = await getDebtToken(total_borrow[symbol]["underlyingAsset"],interestRateMode,false)
        currentDebt = parseInt(await getCurrentDebt(currentDebtToken,variables.id))

        // let stableDebtToken = await getDebtToken(total_borrow[symbol]["underlyingAsset"],1,false)
        // stableDebt = await getCurrentDebt(stableDebtToken,variables.id)
        // console.log("Stable Debt: ",stableDebt)
      }

    tota_interest[symbol] = (total_repay[symbol]["amount"] + currentDebt - total_borrow[symbol]["amount"]) / 10 ** total_borrow[symbol]["decimals"]
  
  }

  return tota_interest
};


main = async () => {
  const [deployer] = await ethers.getSigners();
  let fish = process.env.TARGET_ADDRESS.toLowerCase()
  console.log(fish)
  

  const aaveApe = await ethers.getContractAt('AaveApe', aaveApeAddress);

  const lendingPool = await getLendingPool();
  console.log('lendingPool:', lendingPool.address);
  let reserveData = await aaveApe.getAaveAssetReserveData(usdcAddress);
  //console.log("usdc reserveData: " , reserveData )

  // variable debt
  let interestRateMode = 2;

  let useraccount =  await lendingPool.getUserAccountData(fish);


 // console.log("userdata: ", useraccount); 
  console.log("healthFactor: ", useraccount.healthFactor.mul(BigNumber.from("100")).div(exp).toString()); 
  console.log("totalCollateralETH: ", useraccount.totalCollateralETH.div(exp).toString()); 
  console.log("currentLiquidationThreshold: ", useraccount.currentLiquidationThreshold.toString()); 
  console.log("ltv: ", useraccount.ltv.toString()); 
  
  let reserveData1 =  await lendingPool.getReserveData(usdcAddress);
  console.log("usdc borrow  variable rate: ", reserveData1.currentVariableBorrowRate.mul(BigNumber.from("10000")).div(exp1).toString());
  //console.log("usdc borrow stable rate: ", reserveData1.currentStableBorrowRate.mul(BigNumber.from("10000")).div(exp1).toString());
  console.log("usdc deposit rate: ", reserveData1.currentLiquidityRate.mul(BigNumber.from("10000")).div(exp1).toString());
  console.log("usdc borrow index: ", reserveData1.variableBorrowIndex.mul(BigNumber.from("10000")).div(exp1).toString());

  let result = await aaveApe.getAvailableBorrowInAsset(usdcAddress, fish);
  console.log('available borrow usdc: ', result.toString());


  let aToken = await getAToken(wethAddress);
  let aTokenbtc = await getAToken(wbtcAddress);
  // console.log("aToken: ", aToken)
  let debtToken = await getDebtToken(usdcAddress, interestRateMode, true);
  // console.log("debtToken: ", debtToken)
 
  // let aBalanceBefore = await aToken.balanceOf(fish);
  // console.log('aBalanceBefore: ', aBalanceBefore.toString());
  // let aBalancebtcBefore = await aTokenbtc.balanceOf(fish);
  // console.log('aBalancebtcBefore: ', aBalancebtcBefore.toString());
  // let debtBalanceBefore = await debtToken.balanceOf(fish);
  // console.log('debtBalanceBefore: ', debtBalanceBefore.toString());


// ```
// debetNow  - [sum(borrow) - sum(repay)]  计算支付利息
// 参考https://github.com/Dapp-Learning-DAO/Dapp-Learning/blob/main/defi/Aave/graph/scripts/calculate.ts

  // Get historical interes
  const variables = {
    'id': fish
  };

  let interest = await getInterest(url.matic,querySql,variables)
  console.log("current total interest: ",interest)
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


 