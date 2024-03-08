// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers} = require("hardhat");
const {getMessagesBySrcTxHash} = require('@layerzerolabs/scan-client');


const {
  readRedpacketDeployment,
} = require("../../utils");

async function main() {
  const sepoliaEndpointId =  10232
  const deployment = readRedpacketDeployment();
  const txhash = deployment.messageTxHashOnSepolia
  // please refer to https://www.npmjs.com/package/@layerzerolabs/scan-client for more details
  // enum MessageStatus {
  //   INFLIGHT = 'INFLIGHT',
  //   DELIVERED = 'DELIVERED',
  //   FAILED = 'FAILED',
  //   PAYLOAD_STORED = 'PAYLOAD_STORED',
  //   BLOCKED = 'BLOCKED',
  //   CONFIRMING = 'CONFIRMING',
  // }
  const {messages} = await getMessagesBySrcTxHash(
    sepoliaEndpointId,
    txhash,
  );
  console.log(messages)
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
