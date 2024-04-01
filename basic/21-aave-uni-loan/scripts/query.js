const axios = require('axios')
require("dotenv").config();

let exp = BigInt(10 ** 18);
let exp1 = BigInt(10 ** 27);

// matic address
//https://docs.aave.com/developers/deployed-contracts/v3-mainnet/polygon
let daiAddress = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
let wmaticAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; //wmatic
 let wethAddress = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; //weth
 let wbtcAddress = '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'; //wbtc
let usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'; 

let lendingPoolAddressesProviderAddress = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';

//sushi
let uniswapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

let wethGatewayAddress = '0xC1E320966c485ebF2A0A2A6d3c0Dc860A156eB1B';

// Fill in your address
const aaveApeAddress = '0x4699f609F4FD97A3cf74CB63EFf5cd1200Dfe3dA';


const getAToken = async (_asset) => {
  let lendingPool = await getLendingPool();
  let assetReserveData = await lendingPool['getReserveData'](_asset);
  let assetAToken = await ethers.getContractAt('IAToken', assetReserveData.aTokenAddress);

  return assetAToken;
};

const getLendingPool = async () => {
  const lendingPoolAddressesProvider = await ethers.getContractAt('IPoolAddressesProvider', lendingPoolAddressesProviderAddress);
  let lendingPoolAddress = await lendingPoolAddressesProvider['getPool']();
  let lendingPool = await ethers.getContractAt('IPool', lendingPoolAddress);

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
  matic: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-polygon',
  mainnet: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
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

    tota_interest[symbol] = (
      total_repay[symbol]["amount"] 
      + currentDebt 
      - total_borrow[symbol]["amount"]) / 10 ** total_borrow[symbol]["decimals"]
  
  }

  return tota_interest
};


main = async () => {
  const [deployer] = await ethers.getSigners();
  let fish = process.env.TARGET_ADDRESS.toLowerCase()
  console.log("target:", fish)
  
  const aaveApe = await ethers.getContractAt('AaveApe', aaveApeAddress);

  const lendingPool = await getLendingPool();
  console.log('lendingPool:', lendingPool.target);
  let reserveData = await aaveApe.getAaveAssetReserveData(daiAddress);
  //console.log("dai reserveData: " , reserveData )

  // variable debt
  let interestRateMode = 2;

  let useraccount =  await lendingPool.getUserAccountData(fish);


 // console.log("userdata: ", useraccount); 
  console.log("healthFactor: ", Number(useraccount.healthFactor * BigInt(100) / exp) / 100); 
  console.log("totalCollateralBase: %f USD", Number(useraccount.totalCollateralBase * BigInt(100) / BigInt(10**8)) / 100); 
  console.log("currentLiquidationThreshold: %f %", Number(useraccount.currentLiquidationThreshold) / 100); 
  console.log("ltv: %f %", Number(useraccount.ltv) / 100); 

  let reserveData1 =  await lendingPool.getReserveData(daiAddress);
  console.log("dai borrow variable rate: %f %", Number(reserveData1.currentVariableBorrowRate * BigInt(10000) / exp1) / 100);
  //console.log("usdc borrow stable rate: ", reserveData1.currentStableBorrowRate.mul(BigNumber.from("10000")).div(exp1).toString());
  console.log("dai supply rate: %f %", Number(reserveData1.currentLiquidityRate * BigInt(10000) / exp1) / 100);
  console.log("dai borrow index: ", Number(reserveData1.variableBorrowIndex * BigInt(10000) / exp1) / 100);

  let result = await aaveApe.getAvailableBorrowInAsset(daiAddress, fish);
  console.log('user available borrow dai: %f USD', Number(result * BigInt(1000) / exp) / 1000);


  let aToken = await getAToken(wmaticAddress);
  // let aTokenbtc = await getAToken(wbtcAddress);
  // console.log("aToken: ", aToken)
  let debtToken = await getDebtToken(daiAddress, interestRateMode, true);
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


 