// This script deploys the aa account. We can also use initcode to deploy.

const {task} = require("hardhat/config");

task("deployaa", "deploy aa account")
  .setAction(async (taskArgs) => {
    const [signer] = await ethers.getSigners();
    const entryPointAddress = "0x1306b01bC3e4AD202612D3843387e94737673F53";
    const threshold = 3;
    const owner = await signer.getAddress();
    const DemoAccountFactory = await ethers.getContractFactory("DemoAccount", signer);
    const demoAccount = await DemoAccountFactory.deploy(entryPointAddress, threshold, owner);
    await demoAccount.deployed();
    console.log(`Deployed to ${demoAccount.address}`);
    //0x0165878A594ca255338adfa4d48449f69242Eb8F
    //0x610178dA211FEF7D417bC0e6FeD39F05609AD788
  });