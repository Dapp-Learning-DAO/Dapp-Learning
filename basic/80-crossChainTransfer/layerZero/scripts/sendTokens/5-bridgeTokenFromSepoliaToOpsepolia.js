// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const {
  readRedpacketDeployment,
  saveRedpacketDeployment,
} = require("../../utils");


async function main() {
  const [deployer] = await ethers.getSigners();
  const deployment = readRedpacketDeployment();
  const oftv2Address = deployment.OFTAddressOnSepolia
  const oftv2 = await ethers.getContractAt('OFTV2', oftv2Address, deployer);
  const destinationEndpoindId =  10232
  const transferAmount = ethers.parseEther("2")
  // more details, please refer to https://layerzero.gitbook.io/docs/evm-guides/advanced/relayer-adapter-parameters
  const adapterParams = ethers.solidityPacked(['uint16', 'uint256'], [1, 200000]);
  const toAddress = ethers.zeroPadValue("0xfB0Fb78244aa8e03bfA0eF464c176246040dCC86",32);
  
  // setMinDstGas, otherwise, it will fail
  // PT_SEND = 0;
  // PT_SEND_AND_CALL = 1;
  let tx = await oftv2.setMinDstGas(destinationEndpoindId,0,1,{
    gasLimit: 2483507,
  })
  await tx.wait()
  console.log("setMinDstGas for PT_SEND successfully")


  // Estimate the fees for the cross-chain transfer
  const [nativeFee, zroFee] = await oftv2.estimateSendFee(destinationEndpoindId, toAddress, transferAmount, false, adapterParams);
  // send message
  tx = await oftv2.sendFrom(
    deployer.address,
    destinationEndpoindId,
    toAddress,
    transferAmount,
    { 
      refundAddress: deployer.address, // Address for refunded gas to be sent
      zroPaymentAddress: deployer.address, // Address for ZRO token payment, if used
      adapterParams: adapterParams
    },
    {
      gasLimit: 2483507,
      value: ethers.parseEther("0.03")
  });
  await tx.wait()
  console.log(tx)

  saveRedpacketDeployment({
    BridgetxHashOnSepolia: tx.hash,
  });

  console.log(
    `bridge token successfully`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
