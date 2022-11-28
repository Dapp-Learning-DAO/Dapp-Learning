const { ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = require('@ethersproject/bignumber');
const dydxFlashloanerAddress= require("../DydxFlashloaner.json");

async function main() {
    let [wallet] = await ethers.getSigners();
    const artifactDydxFlashloaner = artifacts.readArtifactSync("DydxFlashloaner");
    let dydxFlashloaner = new ethers.Contract(dydxFlashloanerAddress.address, artifactDydxFlashloaner.abi , wallet);

    const kovanDydxSoloMarginAddr = "0x4EC3570cADaAEE08Ae384779B0f3A45EF85289DE";
    const kovanWETHAddr = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
    
    const artifactWETH = artifacts.readArtifactSync("IWETH9");
    let weth = new ethers.Contract(kovanWETHAddr, artifactWETH.abi , wallet);

    // transfer eth to weth
    let amountInEther = "0.00001"
    let depositeRecipt = await weth.deposit({value: ethers.utils.parseEther(amountInEther)})
    await depositeRecipt.wait()
    console.log("Deposite to WETH contract successfully");

    // transfer weth to dydxFlashloaner to pay for flashloan fee
    let transferRecipt = await weth.transfer(dydxFlashloanerAddress.address,ethers.utils.parseEther(amountInEther));
    await transferRecipt.wait()
    console.log("Transfer WETH to DydxFlashloaner contract successfully")

    const flashLoanRecipt = await dydxFlashloaner.initiateFlashLoan(kovanDydxSoloMarginAddr, kovanWETHAddr, BigNumber.from("1000000000000000000"));
    await flashLoanRecipt.wait()

    console.log(`Flashloan successfully, please check tx hash ${flashLoanRecipt.hash} for more details `)

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });