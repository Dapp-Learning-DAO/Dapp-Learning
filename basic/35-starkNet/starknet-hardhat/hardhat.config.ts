import { HardhatUserConfig } from "hardhat/types";
import "@shardlabs/starknet-hardhat-plugin";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  cairo: {
    // version: "0.6.2", // alternatively choose one of the two venv options below

    // uses (my-venv) defined by `python -m venv path/to/my-venv`
    // venv: "path/to/my-venv"
    venv: "/home/usr/cairo_venv" // <-- put your dir
    
    // uses the currently active Python environment (hopefully with available Starknet commands!) 
    // venv: "active"
  },
  networks: {
    devnet: {
      url: "http://localhost:5000"
    }
  },
  mocha: {
    starknetNetwork: "devnet"   // 本地 starknet-dev-net 网络
    // starknetNetwork: "alpha" // starknet alpha-goerli 测试网络
  }
};

export default config;
