const {task} = require("hardhat/config");
const { EntryPoint__factory} = require('@account-abstraction/contracts');
const { ethers } = require("ethers");
const ABI = EntryPoint__factory.abi;

task("ttt", "")
  .setAction(async (taskArgs) => {
    ethers.providers.JsonRpcProvider
  });