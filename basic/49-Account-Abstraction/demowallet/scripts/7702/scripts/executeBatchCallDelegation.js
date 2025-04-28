const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const main = async () => {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);

  // Read deployment info from JSON file
  const deploymentPath = path.join(__dirname, '../deployments', `${network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found for network: ${network.name}`);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const BATCH_CALL_DELEGATION_ADDRESS = deploymentInfo.contractAddress;
  
  console.log(`Using BatchCallAndSponsorat: ${BATCH_CALL_DELEGATION_ADDRESS}`);

  // Define contract interface with execute function signature
  const batchInterface = new ethers.Interface([
    "function execute(tuple(address to, uint256 value, bytes data)[] calls)"
  ]);
    
  // Define sample transaction parameters for batch execution
  const calls = [
    {
      to: "0x84286648B8252bee9BB4F56A1025913C12537E86",
      value: ethers.parseEther("0.001"),
      data: "0x",
    },
    {
      to: "0xE9e4e7ee5187f8B6EDeB96c31De32A8594A97A53",
      value: 0,
      data: "0xa9059cbb000000000000000000000000ec22b01a5b7f05a4ffae86a1864176f86b05aa3c000000000000000000000000000000000000000000000000000000e8d4a51000",
     

    }
  ];

  // Encode the execute function call with parameters
  const calldata = batchInterface.encodeFunctionData("execute", [calls]);

  const currentNonce = await ethers.provider.getTransactionCount(wallet.address);

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
  const authorizationSignature = wallet.signingKey.sign(authorizationDataHash);

  // Store signature components
  authorizationData.yParity = authorizationSignature.yParity == 0 ? '0x' : '0x01';
  authorizationData.r = authorizationSignature.r;
  authorizationData.s = authorizationSignature.s;

  // Get current gas fee data from the network
  const feeData = await ethers.provider.getFeeData();

  // Prepare complete transaction data structure
  const txData = [
    authorizationData.chainId,
    ethers.toBeHex(currentNonce),
    ethers.toBeHex(feeData.maxPriorityFeePerGas), // Priority fee (tip)
    ethers.toBeHex(feeData.maxFeePerGas), // Maximum total fee willing to pay
    ethers.toBeHex(1000000), // Gas limit
    wallet.address, // Sender address
    '0x', // Value (in addition to batch transfers)
    calldata, // Encoded function call
    [], // Access list (empty for this transaction)
    [
      [
        authorizationData.chainId,
        authorizationData.address,
        authorizationData.nonce,
        authorizationData.yParity,
        authorizationData.r,
        authorizationData.s
      ]
    ]
  ];

  // Encode final transaction data with version prefix
  const encodedTxData = ethers.concat([
    '0x04', // Transaction type identifier
    ethers.encodeRlp(txData)
  ]);

  // Sign the complete transaction
  const txDataHash = ethers.keccak256(encodedTxData);
  const txSignature = wallet.signingKey.sign(txDataHash);

  // Construct the fully signed transaction
  const signedTx = ethers.hexlify(ethers.concat([
    '0x04',
    ethers.encodeRlp([
      ...txData,
      txSignature.yParity == 0 ? '0x' : '0x01',
      txSignature.r,
      txSignature.s
    ])
  ]));

  // Send the raw transaction to the network
  const tx = await ethers.provider.send('eth_sendRawTransaction', [signedTx]);
  
  console.log('tx sent: ', tx);
}

main().then(() => {
  console.log('Execution completed');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});