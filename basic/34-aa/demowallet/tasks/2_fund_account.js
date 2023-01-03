const {task} = require("hardhat/config");

const ABI = "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"depositTo\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"}]";

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
    const receipt = await depositTx.wait();

    const balance = await entryPointContract.connect(signer).balanceOf(account);
    console.log(balance);
  });