import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-abi-exporter";
import "dotenv/config";
import "hardhat-ignore-warnings";
import "hardhat-diamond-abi";
import {Fragment, FunctionFragment} from "ethers";

const funcNameSet = new Set<string>()
const funcSelectorMap = new Map<string, string>()
const eventErrorSet = new Set<string>()
const config: HardhatUserConfig = {
    // warnings: {
    //     'contracts/legacy/**/*': {
    //         default: 'error',
    //     },
    // },
    diamondAbi: {
        name: "DiamondCombined",
        include: ["Facet"],
        strict: true,
        filter: function (abiElement, index, fullAbi, fullyQualifiedName) {
            if (fullyQualifiedName.endsWith("Test1Facet") || fullyQualifiedName.endsWith("Test2Facet")) {
                return false
            }
            // distinct event and error
            if (abiElement.type === "event" || abiElement.type === "error") {
                const minimalAbi = Fragment.from(abiElement).format("minimal")
                if (eventErrorSet.has(minimalAbi)) {
                    return false
                }
                eventErrorSet.add(minimalAbi)
                return true;
            }
            const selector = FunctionFragment.from(abiElement).selector
            if (funcSelectorMap.has(selector)) {
                throw new Error(`${FunctionFragment.from(abiElement).selector}, see:\n\t${Fragment.from(abiElement).format("minimal")}::${fullyQualifiedName}\n\t${funcSelectorMap.get(selector)}\n`)
            }
            funcSelectorMap.set(selector, `${Fragment.from(abiElement).format("minimal")}::${fullyQualifiedName}`)
            if (!funcNameSet.has(fullyQualifiedName)) {
                funcNameSet.add(fullyQualifiedName)
                console.log(` >>> [hardhat-diamond-abi] ${fullyQualifiedName}`)
            }
            return true;
        },
    },
    abiExporter: [{
        runOnCompile: true,
        clear: true,
        path: './abi-pure/general',
        format: "json"
    }, {
        runOnCompile: true,
        clear: true,
        path: './abi-pure/ethers',
        pretty: true
    }],
    networks: {
        hardhat: {
            mining: {
                interval: 50
            }
            // forking: {
            //   url: "https://arbitrum.public-rpc.com",
            //   // blockNumber: 132401260
            // }
        },
        bsc: {
            url: "https://bsc.rpc.blxrbdn.com",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        bsc_testnet: {
            url: "https://bsc-testnet.publicnode.com",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        bsc_op_testnet: {
            url: "https://opbnb-testnet-rpc.bnbchain.org",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        eth: {
            url: "https://eth.public-rpc.com",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        arbitrum: {
            url: "https://endpoints.omniatech.io/v1/arbitrum/one/public",
            accounts: [process.env.PRIVATE_KEY as string],
        },
        arbitrum_goerli: {
            url: "https://arbitrum-goerli.publicnode.com",
            accounts: [process.env.PRIVATE_KEY as string],
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_BSC as string
    },
    solidity: {
        compilers: [
            standardSettings("0.8.21"),
        ]
    },
};

function standardSettings(version: string) {
    return {
        version: version,
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            // viaIR: true
        },
    }
}

export default config;
