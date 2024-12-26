// const hre = require('hardhat');
require('dotenv').config();
const fs = require('fs');
const ERC20ABI = require('@chainlink/contracts/abi/v0.8/ERC20.json');

const senderRouter = '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165'; //  Arbitrum Sepolia testnet
const linkTokenAddress = '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E'; //  Arbitrum Sepolia testnet
const CCIPBNMTokenAddress = '0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D'; // Arbitrum Sepolia testnet
const destinationChainSelector = '16015286601757825753'; // 目标区块链的 CCIP 链标识符。 Sepolia

task('sendToken', 'send token by ccip')
  .addParam('type', 'token')
  .setAction(async (taskArgs) => {
    console.log('type', taskArgs.type);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.log('Please set privateKey');
      return;
    }
    await senderFunction(taskArgs.type);
  });

async function senderFunction(type) {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  const SenderByToken = await ethers.getContractFactory('TokenTransferor');
  const SenderByTokenInstance = await SenderByToken.deploy(senderRouter, linkTokenAddress);
  await SenderByTokenInstance.waitForDeployment();
  try {
    if (SenderByTokenInstance.target) {
      console.log('SenderByTokenInstance.address', SenderByTokenInstance.target);
      const res = await transfer(CCIPBNMTokenAddress, SenderByTokenInstance, deployer, '0.1', true);
      if (!res) {
        console.log('transfer error');
        return;
      }
      if (type === 'link') {
        const newRes = await transfer(linkTokenAddress, SenderByTokenInstance, deployer, '0.5', false);
        if (!newRes) {
          console.log('transfer error');
          return;
        }
        await transferTokensPayLINK(SenderByTokenInstance.target);
      } else {
        const newRes = await transfer('0x00eth', SenderByTokenInstance, deployer, '0.01', false);
        if (!newRes) {
          console.log('transfer error');
          return;
        }
        await transferTokensPayNative(SenderByTokenInstance.target);
      }
    }
    return SenderByTokenInstance;
  } catch (error) {
    console.log('senderFunction error', error);
    return null;
  }
}

async function transfer(tokenAddress, SenderByTokenInstance, deployer, amountNumber, isCallBack) {
  const web3Provider = new ethers.JsonRpcProvider('https://arbitrum-sepolia.infura.io/v3/' + process.env.INFURA_ID);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, web3Provider);
  if (tokenAddress === '0x00eth') {
    const amount = ethers.parseEther(amountNumber);
    try {
      const balance = await web3Provider.getBalance(wallet.address);
      // 检查余额是否足够
      if (balance >= amount) {
        // 构造交易对象
        const transaction = {
          to: SenderByTokenInstance.target, // 合约地址
          value: amount, // 发送的ETH数量
        };

        // 发送交易
        const tx = await wallet.sendTransaction(transaction);
        console.log('Transaction:', tx.hash);

        // 等待交易确认
        await tx.wait();
        console.log('contractBalance', await web3Provider.getBalance(SenderByTokenInstance.target));
        return true;
      } else {
        console.log('Please get some ETH first');
        return false;
      }
    } catch (error) {
      console.error('Error sending ETH:', error);
      return false;
    }
  } else {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, wallet);
    const balance = await tokenContract.balanceOf(deployer.address);
    console.log(tokenAddress + ' balance:', balance.toString());
    if (balance < ethers.parseUnits(amountNumber, 18)) {
      console.log('Please get some LINK first');
      return;
    }
    if (!SenderByTokenInstance) {
      console.log('Please deploy contract Receiver first');
      return;
    }
    try {
      const amount = ethers.parseUnits(amountNumber, 18);
      console.log('SenderByTokenInstance.target', SenderByTokenInstance.target);
      const tx = await tokenContract.transfer(SenderByTokenInstance.target, amount);
      await tx.wait();
      console.log('transfer success');
      // await sendMessage(SenderInstance);
      if (isCallBack) {
        await allowlistDestinationChain(SenderByTokenInstance);
      }
      return true;
    } catch (e) {
      console.log('transfer error', e);
      return false;
    }
  }
}

async function transferTokensPayLINK(SenderByTokenAddress) {
  // 获取合约实例
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const SenderByTokenInstance = await ethers.getContractAt('TokenTransferor', SenderByTokenAddress);
  if (SenderByTokenInstance) {
    console.log('transfer token by link====================');
    const amount = ethers.parseUnits('0.01', 18);
    try {
      const tx = await SenderByTokenInstance.transferTokensPayLINK(BigInt(destinationChainSelector), wallet.address, CCIPBNMTokenAddress, amount);
      await tx.wait();
      console.log('transfer token by link success', tx);
    } catch (error) {
      console.log('transferTokensPayLINK error', error);
    }
  } else {
    console.log('Please deploy contract Sender first');
  }
}

async function transferTokensPayNative(SenderByTokenAddress) {
  // 获取合约实例
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  const SenderByTokenInstance = await ethers.getContractAt('TokenTransferor', SenderByTokenAddress);
  if (SenderByTokenInstance) {
    console.log('transfer token by token====================');
    const amount = ethers.parseUnits('0.01', 18);
    try {
      console.log('destinationChainSelector:', destinationChainSelector);
      console.log('wallet.address:', wallet.address);
      console.log('CCIPBNMTokenAddress:', CCIPBNMTokenAddress);
      console.log('amount:', amount);
      const tx = await SenderByTokenInstance.transferTokensPayNative(BigInt(destinationChainSelector), wallet.address, CCIPBNMTokenAddress, amount);
      await tx.wait();
      console.log('transfer token by token success', tx);
    } catch (error) {
      console.log('transferTokensPayNative error', error);
    }
  } else {
    console.log('Please deploy contract Sender first');
  }
}

async function allowlistDestinationChain(SenderByTokenInstance) {
  const tx = await SenderByTokenInstance.allowlistDestinationChain(destinationChainSelector, true);
  await tx.wait();
  console.log('allowlistDestinationChain tx  sucessss');
}

module.exports = {};
