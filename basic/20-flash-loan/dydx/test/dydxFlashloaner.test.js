const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("DydxFlashloaner", function() {

  let abi = [{"inputs":[{"internalType":"address","name":"_solo","type":"address"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"initiateFlashLoan","outputs":[],"stateMutability":"nonpayable","type":"function"}];

  // const abi = JSON.parse(_abi)

  const contractAddr = "0x24adcc28d0c29522a23eb999d1619eb60032cc0e"

  const kovanDydxSoloMarginAddr = "0x4EC3570cADaAEE08Ae384779B0f3A45EF85289DE";
  const kovanWETHAddr = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
  // 1000000000000000000

  let privateKey = "0x7316449fc19c081e5bf2b5e9c0bbf80b65610d8dfb0b97e86f848f564e38e305";
  let provider = ethers.getDefaultProvider();
  let walletWithProvider = new ethers.Wallet(privateKey, provider);

  it("initiateFlashLoan", async function() {

    // 使用Provider 连接合约，将只有对合约的可读权限
    let contract = new ethers.Contract(contractAddr, abi, walletWithProvider);

    // console.log(contract)

    const result = await contract.initiateFlashLoan(kovanDydxSoloMarginAddr, kovanWETHAddr, 1000000000000000000);

    console.log(result)
    expect(1).to.equal(1);

  });
});
