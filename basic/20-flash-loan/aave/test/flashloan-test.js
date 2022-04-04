const { ethers } = require("hardhat");
const flashLoanAddress = require("../FlashLoanAddress.json");

let wallet;
let flashLoan;
    
describe('flashloan test', function () {
  beforeEach(async function () {
    [wallet] = await ethers.getSigners();
    const artifactFlashLoan = artifacts.readArtifactSync("Flashloan");
    flashLoan = new ethers.Contract(flashLoanAddress.address, artifactFlashLoan.abi , wallet);
  });

  it('start flashloan', async function () {

    // Ether amount to send
    let amountInEther = '0.02'
    // Create a transaction object
    let transferTX = {
      // transfer ether to flashLoanAddress to pay for flashloan fee
      to: flashLoanAddress.address,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amountInEther)
    }

    // Send a transaction
    let recipt = await wallet.sendTransaction(transferTX)
    await recipt.wait()

    let asset = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" 
    // do flashloan
    let res = await flashLoan.flashloan(asset,{ gasLimit: 250000 });
    await res.wait()
    console.log(`Flashloan successfully, please check tx hash ${res.hash} for more details `)
  })

});
