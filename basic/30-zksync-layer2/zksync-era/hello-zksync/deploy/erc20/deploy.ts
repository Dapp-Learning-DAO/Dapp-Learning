import { deployContract } from "../utils";

// This script is used to deploy an ERC20 token contract
// as well as verify it on Block Explorer if possible for the network

// Important: make sure to change contract name and symbol in contract source
// at contracts/erc20/MyERC20Token.sol
export default async function () {
  await deployContract("MyERC20Token");
}
