const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const main = async () => {
  const [deployer] = await ethers.getSigners();

  // Read deployment info from JSON file
  const deploymentPath = path.join(__dirname, '../deployments', `${network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found for network: ${network.name}`);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const BATCH_CALL_DELEGATION_ADDRESS = deploymentInfo.contractAddress;
  
  console.log(`Using BatchCallDelegation at: ${BATCH_CALL_DELEGATION_ADDRESS}`);

  // Define contract interface with execute function signature
  const batchInterface = new ethers.Interface([
    "function execute(tuple(bytes data, address to, uint256 value)[] calls)"
  ]);
    
  // Define sample transaction parameters for batch execution
  const calls = [
    {
      data: "0x",
      to: "0x84286648B8252bee9BB4F56A1025913C12537E86",
      value: ethers.parseEther("0.001")
    }
  ];

  // Encode the execute function call with parameters
  const calldata = batchInterface.encodeFunctionData("execute", [calls]);

  console.log('Calldata:', calldata);

  const currentNonce = await ethers.provider.getTransactionCount(deployer.address);

  console.log('Current nonce:', currentNonce);

  const authorizationData = {
    chainId: '0xaa36a7',
    address: BATCH_CALL_DELEGATION_ADDRESS,
    nonce: ethers.toBeHex(currentNonce + 1),
  }

  // Encode authorization data according to EIP-712 standard
  const encodedAuthorizationData = ethers.concat([
    '0x05', // MAGIC code for EIP7702
    ethers.encodeRlp([
      authorizationData.chainId,
      authorizationData.address,
      authorizationData.nonce,
    ])
  ]);

  // Generate and sign authorization data hash
  const authorizationDataHash = ethers.keccak256(encodedAuthorizationData);
  console.log('Authorization data hash:', authorizationDataHash);
   const authorizationSignature = await deployer.signMessage(ethers.getBytes(authorizationDataHash));
  // const authorizationSignature = await deployer.signMessage((authorizationDataHash));
  console.log('Authorization signature:', authorizationSignature);


  const { v, r, s } = ethers.Signature.from(authorizationSignature);
  
  console.log('V:', v);

  // Store signature components
  let yParity = v === 27 ? '0x' : '0x01';
  authorizationData.r = r;
  authorizationData.s = s;

  
  // Get current gas fee data from the network
  const feeData = await ethers.provider.getFeeData();

  console.log('Fee data:', feeData);

  // Prepare complete transaction data structure
  const txData = [
    authorizationData.chainId,
    ethers.toBeHex(currentNonce),
    ethers.toBeHex(feeData.maxPriorityFeePerGas), // Priority fee (tip)
    ethers.toBeHex(feeData.maxFeePerGas), // Maximum total fee willing to pay
    ethers.toBeHex(1000000), // Gas limit
    deployer.address, // Sender address
    '0x', // Value (in addition to batch transfers)
    calldata, // Encoded function call
    [], // Access list (empty for this transaction)
    [
      [
        authorizationData.chainId,
        authorizationData.address,
        authorizationData.nonce,
        yParity,
        authorizationData.r,
        authorizationData.s
      ]
    ]
  ];

  console.log('Tx data:', txData);

  // Encode final transaction data with version prefix
  const encodedTxData = ethers.concat([
    '0x04', // Transaction type identifier
    ethers.encodeRlp(txData)
  ]);

  console.log('Tx data:', encodedTxData);

  // Sign the complete transaction
  const txDataHash = ethers.keccak256(encodedTxData);

  console.log('Tx data hash:', txDataHash);
  let txSignature = await deployer.signMessage(ethers.getBytes(txDataHash));

  console.log('Tx signature:', txSignature);


  txSignature = ethers.Signature.from(txSignature);
  yParity = txSignature.v === 27 ? '0x' : '0x01';
  console.log('yParity:', yParity);

  // Construct the fully signed transaction
  const signedTx = ethers.hexlify(ethers.concat([
    '0x04',
    ethers.encodeRlp([
      ...txData,
      yParity ,
      txSignature.r,
      txSignature.s
    ])
  ]));

  // Send the raw transaction to the network
//  const tx = await ethers.provider.send('eth_sendRawTransaction', [signedTx]);
  
  console.log('tx sent: ', tx);
}

main().then(() => {
  console.log('Execution completed');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});