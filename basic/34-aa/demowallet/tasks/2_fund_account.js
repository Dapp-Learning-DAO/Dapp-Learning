const {task} = require("hardhat/config");
const { EntryPoint__factory} = require('@account-abstraction/contracts');
const ABI = EntryPoint__factory.abi;

task("fundaa", "")
  .addPositionalParam("account")
  .addPositionalParam("ethers")
  .setAction(async (taskArgs) => {
    const account = taskArgs.account;
    const ether = ethers.utils.parseEther(taskArgs.ethers);

    const [signer] = await ethers.getSigners();
    const entryPointAddress = "0x1306b01bC3e4AD202612D3843387e94737673F53";

    const entryPointContract = new ethers.Contract(entryPointAddress, ABI);
    
    const depositTx = await entryPointContract.connect(signer).depositTo(account, {value: ether});
    await depositTx.wait();

    const balance = await entryPointContract.connect(signer).balanceOf(account);
    console.log(`balance of ${account} is: ${ethers.utils.formatEther(balance)}`);
  });