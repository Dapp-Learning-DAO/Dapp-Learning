// goerli testnet

import { erc20ABI } from 'wagmi'

import UniswapRouter2ABI from "../abi/UniswapRouter2ABI.json";

export const ROUTER2_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
export const WETH_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
export const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

export const router2ContractConfig = {
  address: ROUTER2_ADDRESS,
  abi: UniswapRouter2ABI,
};
export const wethContractConfig = {
  address: WETH_ADDRESS,
  abi: erc20ABI,
}
export const uniContractConfig = {
  address: UNI_ADDRESS,
  abi: erc20ABI,
}