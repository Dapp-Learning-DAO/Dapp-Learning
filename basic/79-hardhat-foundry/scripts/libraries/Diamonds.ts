import {
    AddressLike,
    BaseContract,
    BytesLike,
    Contract,
    ContractRunner,
    FunctionFragment,
} from "ethers"
import { ethers } from "hardhat"
import { DiamondCutFacet, DiamondLoupeFacet, OwnershipFacet } from "./typechain-types"
import { deploy } from "./deployLib"
import DiamondAbi from "./abi/Diamond.json"
/**
 * 钻石合约的类型，包含多个功能接口。
 */
export type Diamond = DiamondCutFacet & DiamondLoupeFacet & OwnershipFacet & {
    /**
     * 钻石合约的地址。
     */
    address: string,
    logic?: {
        /**
         * 钻石合约的切面功能。
         */
        diamondCutFacet: string,
        /**
         * 钻石合约的放大镜功能(用于查看切面)
         */
        diamondLoupeFacet: string,
        /**
         * 钻石合约的所有权功能。
         */
        ownershipFacet: string,
    },
    /**
     * 代理功能，用于创建代理合约。
     */
    proxy: typeof DiamondAction.prototype.proxy,
    /**
     * 编码代理功能，用于生成代理合约的编码数据。
     */
    encodeProxy: typeof DiamondAction.prototype.encodeProxy,
    /**
     * 升级功能，用于升级合约。
     */
    upgrade: typeof DiamondAction.prototype.upgrade,
    /**
     * 编码升级功能，用于生成升级合约的编码数据。
     */
    encodeUpgrade: typeof DiamondAction.prototype.encodeUpgrade,
}

/**
 * 钻石合约的切面操作类型。
 */
export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

/**
 * 选择器的类型，包含合约、克隆函数和名称函数。
 */
export type Selectors = string[] & {
    /**
     * 合约的基础信息。
     */
    contract: BaseContract,
    /**
     * 克隆选择器，用于复制选择器数组。
     * @param functionNameOrSigs 要复制的选择器数组或函数名。
     * @param exclude 是否排除选择器。
     * @returns 复制后的选择器。
     */
    clone: (functionNameOrSigs: string[], exclude?: boolean) => Selectors,
    /**
     * 获取选择器名称映射。
     * @returns 选择器名称映射。
     */
    names: () => { [name: string]: string }
}

export class Diamonds {
    // Diamond version: 2
    /**
     * 部署Diamond合约并返回一个Diamond实例。
     * @param {boolean} isVerify - 是否需要验证合约部署。
     * @returns {Promise<Diamond>} - 包含Diamond合约的Promise。
     */
    static deploy = async (isVerify: boolean): Promise<Diamond> => {
        // 获取部署合约的所有者
        const owner = (await ethers.getSigners())[0]

        // 部署各个Diamond合约的关键组件
        const [
            diamondInit,
            diamondCutFacet,
            diamondLoupeFacet,
            ownershipFacet,
        ] = await deploy(isVerify, "DiamondInit", "DiamondCutFacet", "DiamondLoupeFacet", "OwnershipFacet")

        // 部署Diamond代理合约
        const [diamondProxy] = await deploy(isVerify, ["Diamond", [owner.address, diamondCutFacet.address]])

        // 创建Diamond合约实例
        const diamond = new Contract(diamondProxy.address, DiamondAbi, owner) as any as Diamond
        diamond.address = diamondProxy.address
        diamond.logic = {
            diamondCutFacet: diamondCutFacet.address,
            diamondLoupeFacet: diamondLoupeFacet.address,
            ownershipFacet: ownershipFacet.address,
        }

        // 执行diamondCut并初始化
        const tx = await diamond.diamondCut([
            {
                facetAddress: diamondLoupeFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: Diamonds.parseSelectors(diamondLoupeFacet),
            },
            {
                facetAddress: ownershipFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: Diamonds.parseSelectors(ownershipFacet),
            }
        ], diamondInit.address, diamondInit.interface.encodeFunctionData("init"))
        await tx.wait()

        // 返回包含Diamond实例的Promise
        return Diamonds.withAction(diamond)
    }


    /**
     * 通过指定的Diamond合约地址和运行者创建一个Diamond实例。
     * @param {string} diamond - 要创建实例的Diamond合约地址。
     * @param {ContractRunner | null | undefined} runner - 可选参数，用于指定合约运行者。
     * @returns {Diamond} - 包含Diamond合约的实例。
     */
    static from = (diamond: string, runner?: ContractRunner | null | undefined): Diamond => {
        // 创建一个Diamond合约实例并返回
        return Diamonds.withAction(new Contract(diamond, DiamondAbi, runner) as any as Diamond)
    }


    /**
     * 解析指定合约的函数选择器并返回一个函数选择器集合。
     * @param {BaseContract} contract - 要解析函数选择器的合约对象。
     * @param {string[]} funcHeaderOrSigs - 可选参数，要包含或排除的函数头部或签名数组。
     * @returns {Selectors} - 包含函数选择器的集合。
     */
    static parseSelectors = (contract: BaseContract, funcHeaderOrSigs?: string[]) => {
        let selectors: Selectors = [] as any

        // 遍历合约接口中的每个函数并将其选择器添加到集合中
        contract.interface.forEachFunction((func: FunctionFragment) => {
            selectors.push(func.selector)
        })

        selectors.contract = contract

        // 获取函数名称的映射
        selectors.names = function () {
            let names = {} as { [name: string]: string }
            contract.interface.forEachFunction((func: FunctionFragment) => {
                for (let selector of this) {
                    if (func.selector == selector) {
                        names[selector] = func.format("minimal")
                        break
                    }
                }
            })
            return names
        }

        // 克隆选择器集合并可选择性地排除或包含特定函数头部或签名
        selectors.clone = function (funcHeaderOrSigs: string[], exclude?: boolean) {
            const selectors = this.filter((selector: string) => {
                for (const funcHeaderOrSig of funcHeaderOrSigs) {
                    if (selector === Diamonds.parseSelector(funcHeaderOrSig)) {
                        return !exclude
                    }
                }
                return exclude
            }) as Selectors
            console.log(selectors)
            selectors.contract = this.contract
            selectors.clone = this.clone.bind(selectors)
            selectors.names = this.names.bind(selectors)
            return selectors
        }

        // 如果提供了要包含或排除的函数头部或签名数组，则应用克隆操作
        if (funcHeaderOrSigs?.length) selectors = selectors.clone(funcHeaderOrSigs)
        return selectors
    }


    /**
     * 创建包含DiamondAction功能的Diamond实例。
     * @param {Diamond} diamond - 要添加DiamondAction功能的Diamond实例。
     * @returns {Diamond} - 包含DiamondAction功能的Diamond实例。
     */
    private static withAction = (diamond: Diamond): Diamond => {
        // 创建DiamondAction实例并将其功能添加到Diamond
        const diamondAction = new DiamondAction(diamond)
        diamond.proxy = diamondAction.proxy
        diamond.upgrade = diamondAction.upgrade
        diamond.encodeProxy = diamondAction.encodeProxy
        diamond.encodeUpgrade = diamondAction.encodeUpgrade

        return diamond
    }


    /**
     * 解析函数头部或签名并返回相应的函数选择器。
     * @param {string} funcHeaderOrSig - 要解析的函数头部或签名。
     * @returns {string | undefined} - 如果函数头部或签名有效，则返回相应的函数选择器；否则返回undefined。
     */
    private static parseSelector = (funcHeaderOrSig: string) => {
        // 如果提供的字符串以 "0x" 开头，认为它已经是一个函数选择器，直接返回
        if (funcHeaderOrSig.startsWith("0x")) {
            return funcHeaderOrSig
        }

        // 如果提供的字符串包含 "("，则视为函数头部，通过 FunctionFragment 解析并返回相应的函数选择器
        if (funcHeaderOrSig.includes("(")) {
            return FunctionFragment.from(funcHeaderOrSig).selector
        }
        // 如果不符合以上条件，则返回undefined
    }
}

/**
 * 钻石操作类，用于管理钻石合约的操作。
 */
class DiamondAction {
    readonly diamond: Diamond

    /**
     * 创建一个新的DiamondAction实例。
     * @param diamond 钻石合约实例。
     */
    constructor(diamond: Diamond) {
        this.diamond = diamond
    }

    /**
     * 创建代理合约。
     * @param newFacet 新的合约。
     * @param init 初始化地址。
     * @param initData 初始化数据。
     * @returns 返回代理合约的结果。
     */
    proxy = async (newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        return await this.do(undefined, newFacet, init, initData)
    }

    /**
     * 编码代理合约。
     * @param newFacet 新的合约。
     * @param init 初始化地址。
     * @param initData 初始化数据。
     * @returns 返回编码后的代理合约数据。
     */
    encodeProxy = async (newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        return await this.encodeDo(undefined, newFacet, init, initData)
    }

    /**
     * 升级合约。
     * @param oldFacet 旧合约地址。
     * @param newFacet 新的合约。
     * @param init 初始化地址。
     * @param initData 初始化数据。
     * @returns 返回升级合约的结果。
     */
    upgrade = async (oldFacet: AddressLike, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        return await this.do(oldFacet, newFacet, init, initData)
    }

    /**
     * 编码升级合约。
     * @param oldFacet 旧合约地址。
     * @param newFacet 新的合约。
     * @param init 初始化地址。
     * @param initData 初始化数据。
     * @returns 返回编码后的升级合约数据。
     */
    encodeUpgrade = async (oldFacet: AddressLike, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        return await this.encodeDo(oldFacet, newFacet, init, initData)
    }

    private do = async (oldFacet: AddressLike | undefined, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        const data = await this.encodeDo(oldFacet, newFacet, init, initData)
        if (this.diamond?.runner?.sendTransaction) {
            const tx = await this.diamond.runner.sendTransaction({
                to: this.diamond.address,
                data: data
            })
            return await tx.wait()
        }
        throw new Error("Signer not exist!")
    }

    private encodeDo = async (oldFacet: AddressLike | undefined, newFacet: BaseContract, init?: AddressLike, initData?: BytesLike) => {
        const chainSelectors = !oldFacet ? [] : await this.diamond.facetFunctionSelectors(oldFacet)
        const localSelectors = Diamonds.parseSelectors(newFacet)
        const onlyLocals = localSelectors.filter(item => !chainSelectors.includes(item))
        const onlyChains = chainSelectors.filter(item => !localSelectors.includes(item))
        const bothExists = chainSelectors.filter(chainSelector => {
            for (let localSelector of localSelectors) {
                if (chainSelector === localSelector) {
                    return true
                }
            }
        })
        const cut = []
        const newContractAddress = await newFacet.getAddress()
        // 添加
        if (onlyLocals.length) {
            cut.push({
                facetAddress: newContractAddress,
                action: FacetCutAction.Add,
                functionSelectors: onlyLocals
            })
        }
        // 移除
        if (onlyChains.length) {
            cut.push({
                facetAddress: ethers.ZeroAddress,
                action: FacetCutAction.Remove,
                functionSelectors: onlyChains
            })
        }
        // 替换
        if (bothExists.length) {
            cut.push({
                facetAddress: newContractAddress,
                action: FacetCutAction.Replace,
                functionSelectors: bothExists
            })
        }
        if (cut.length == 0) throw new Error("Nothing need to upgrade!")
        return this.diamond.interface.encodeFunctionData("diamondCut", [cut, init ?? ethers.ZeroAddress, initData ?? "0x"])
    }
}

