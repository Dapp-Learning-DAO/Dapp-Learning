import Web3 from 'web3';
import { abi, bytecode } from './SBTCompiled.json'; // 编译好的合约 ABI 和字节码

// 初始化 Web3
const web3 = new Web3("https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID");

// 部署者钱包私钥
const privateKey = 'YOUR_PRIVATE_KEY';
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

// 部署合约的函数
async function deploySBT() {
    const SBTContract = new web3.eth.Contract(abi);

    // 部署合约
    const sbtInstance = await SBTContract.deploy({ data: bytecode })
        .send({
            from: account.address,
            gas: 5000000,
            gasPrice: web3.utils.toWei('20', 'gwei')
        });

    console.log("SBT contract deployed at:", sbtInstance.options.address);
    return sbtInstance;
}

// 调用 mint 方法来为用户铸造 SBT
async function mintSBT(sbtInstance, to, tokenId) {
    await sbtInstance.methods.mint(to, tokenId)
        .send({ from: account.address, gas: 500000 });

    console.log(`Minted SBT token with ID ${tokenId} for address ${to}`);
}

// 主函数，部署合约并铸造一个 SBT
(async () => {
    const sbtInstance = await deploySBT();

    // 假设我们要为地址 '0xRecipientAddress' 铸造一个 SBT，tokenId 为 1
    await mintSBT(sbtInstance, '0xRecipientAddress', 1);
})();
