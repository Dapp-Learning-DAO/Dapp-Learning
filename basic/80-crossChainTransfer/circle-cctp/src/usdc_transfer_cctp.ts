// Transfer USDC on testnet from Ethereum to Avalanche
// https://developers.circle.com/stablecoins/docs/transfer-usdc-on-testnet-from-ethereum-to-avalanche
// contract deployment
// https://developers.circle.com/stablecoins/docs/evm-smart-contracts
// USDC Testnet faucet
// https://faucet.circle.com/?_gl=1*ouhs7l*_ga_GJDVPCQNRV*MTcwODUwNDQ1OC4zLjEuMTcwODUwNDQ5MS4yNy4wLjA.

import dotenv from "dotenv";
dotenv.config();

import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  erc20Abi,
  getContract,
  http,
  keccak256,
  pad,
  parseAbi,
  toBytes,
} from "viem";
import { avalancheFuji, sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const tokenMessengerAbi = parseAbi([
  "function depositForBurn(uint256 amount,uint32 destinationDomain, bytes32 mintRecipient, address burnToken) external returns (uint64 _nonce)"
]);
const messageTransmitterAbi = parseAbi([
  "function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool success)"
]);

// Sepolia Testnet Contract Addresses
const ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS =
  "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
const USDC_ETH_CONTRACT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const USDC_AVAX_CONTRACT_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
const AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS =
  "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79";

const sepoliaHttp = http(
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
);
const avaxTestnetHttp = http(`https://api.avax-test.network/ext/bc/C/rpc`);

const main = async () => {
  const sepoliaAccount = privateKeyToAccount(
    `${process.env.SEPOLIA_ACCOUNT_PK as `0x${string}`}`
  );
  const avaxTestnetAccount = privateKeyToAccount(
    `${process.env.AVAX_FUJI_PRIVATE_KEY as `0x${string}`}`
  );
  console.log(
    `Ethereum Sepolia testnet Wallet address: ${avaxTestnetAccount.address}`
  );
  console.log(
    `Avalache Fuji testnet Wallet address: ${avaxTestnetAccount.address}`
  );

  const sepoliaPublicClient = createPublicClient({
    chain: sepolia,
    transport: sepoliaHttp,
  });

  const sepoliaWalletClient = createWalletClient({
    chain: sepolia,
    transport: sepoliaHttp,
    account: sepoliaAccount,
  });

  const avaxTestnetPublicClient = createPublicClient({
    chain: avalancheFuji,
    transport: avaxTestnetHttp,
  });

  const avaxTestnetWalletClient = createWalletClient({
    chain: avalancheFuji,
    transport: avaxTestnetHttp,
    account: avaxTestnetAccount,
  });

  // initialize contracts using address and ABI
  const ethTokenMessengerContract = getContract({
    address: ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS,
    abi: tokenMessengerAbi,
    client: { public: sepoliaPublicClient, wallet: sepoliaWalletClient },
  });
  const usdcEthContract = getContract({
    address: USDC_ETH_CONTRACT_ADDRESS,
    abi: erc20Abi,
    client: { public: sepoliaPublicClient, wallet: sepoliaWalletClient },
  });

  const avaxMessageTransmitterContract = getContract({
    address: AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
    abi: messageTransmitterAbi,
    client: {
      public: avaxTestnetPublicClient,
      wallet: avaxTestnetWalletClient,
    },
  });

  const usedAvaxContract = getContract({
    address: USDC_AVAX_CONTRACT_ADDRESS,
    abi: erc20Abi,
    client: {
      public: avaxTestnetPublicClient,
      wallet: avaxTestnetWalletClient,
    },
  });

  // AVAX destination address
  const mintRecipient = avaxTestnetAccount.address;
  const destinationAddressZeroPad = pad(mintRecipient, { size: 32 });
  const AVAX_DESTINATION_DOMAIN = 1;

  const avaxBeforeBalance = (await usedAvaxContract.read.balanceOf([
    mintRecipient,
  ])) as bigint;

  // Amount that will be transferred
  const amount = 1n * 100000n;
  console.log(
    `sepolia test USDC balanceOf     ${await usdcEthContract.read.balanceOf([
      sepoliaAccount.address,
    ])}`
  );
  console.log(`Amount that will be transferred ${amount}`);

  // STEP 1: Approve messenger contract to withdraw from our active eth address
  console.log(
    `\nSTEP 1: Approve messenger contract to withdraw from our active eth address`
  );
  const approveTx = await usdcEthContract.write.approve([
    ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS,
    amount,
  ]);
  console.log(`ApproveTx ${approveTx}`);
  const approveTxReceipt = await sepoliaPublicClient.waitForTransactionReceipt({
    hash: approveTx,
  });
  console.log("ApproveTxReceipt: ", approveTxReceipt);

  // STEP 2: Burn USDC
  console.log(`\nSTEP 2: Burn USDC`);
  const burnTx = await ethTokenMessengerContract.write.depositForBurn([
    amount,
    AVAX_DESTINATION_DOMAIN,
    destinationAddressZeroPad,
    USDC_ETH_CONTRACT_ADDRESS,
  ]);
  console.log(`BurnTx ${burnTx}`);
  const burnTxReceipt = await sepoliaPublicClient.waitForTransactionReceipt({
    hash: burnTx,
  });
  console.log("\nBurnTxReceipt: ", burnTxReceipt);

  // STEP 3: Retrieve message bytes from logs
  console.log(`\nSTEP 3: Retrieve message bytes from logs`);
  const messageSentEvent = burnTxReceipt.logs.find(
    (_log) => _log.topics[0] == keccak256(toBytes("MessageSent(bytes)"))
  );
  const {
    args: { message },
  } = decodeEventLog({
    abi: parseAbi(["event MessageSent(bytes message)"]),
    data: messageSentEvent!.data,
    topics: messageSentEvent!.topics,
  });

  const messageHash = keccak256(message);
  console.log("\nmessage", message);
  console.log("\nmessageHash", messageHash);

  // STEP 4: Fetch attestation signature
  console.log(`\nSTEP 4: Fetch attestation signature`);
  let attestationResponse: any = { status: "pending" };
  while (attestationResponse.status != "complete") {
    const response = await fetch(
      `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
    );
    attestationResponse = await response.json();
    await new Promise((r) => setTimeout(r, 2000));
  }

  const attestationSignature = attestationResponse?.attestation;
  console.log(`Signature: ${attestationSignature}`);

  // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
  console.log(
    `\nSTEP 5: Using the message bytes and signature recieve the funds on destination chain and address`
  );
  const receiveTx = await avaxMessageTransmitterContract.write.receiveMessage([
    message,
    attestationSignature,
  ]);
  console.log(`ReceiveTx ${receiveTx}`);
  const receiveTxReceipt =
    await avaxTestnetPublicClient.waitForTransactionReceipt({
      hash: receiveTx,
    });
  console.log("\nReceiveTxReceipt: ", receiveTxReceipt);

  const avaxAfterBalance = (await usedAvaxContract.read.balanceOf([
    mintRecipient,
  ])) as bigint;

  console.log(
    `Check USDC on Avax testnet balanceOf increasement ${
      avaxAfterBalance - avaxBeforeBalance
    }`
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
