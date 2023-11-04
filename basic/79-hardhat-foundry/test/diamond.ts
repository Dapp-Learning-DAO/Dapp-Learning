import {ethers} from "hardhat";
import {deploy} from "../scripts/libraries/deployLib";
import {Example} from "../typechain-types";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers"
import {Diamonds} from "../scripts/libraries/Diamonds";

describe("钻石合约", () => {
    let user: HardhatEthersSigner
    afterEach(()=>{
        console.log("afterEach------------------------------------")
    })
    beforeEach(()=>{
        console.log("beforeEach------------------------------------")
    })
    before("user", async () => {
        console.log("before------------------------------------")
        const accounts = await ethers.getSigners()
        user = accounts[0]
    })

    async function deployFixture() {
        return await Diamonds.deploy(false)
    }

    it("代理测试样例", async () => {
        const diamond = await loadFixture(deployFixture);
        const [example] = await deploy(false, "Example")
        await diamond.proxy(example);
        await (await (example.attach(diamond.address) as Example).setNumber(1024n)).wait()
        expect(await (example.attach(diamond.address) as Example).getNumber()).eq(1024n)
    });
    it("升级测试样例", async () => {
        const diamond = await loadFixture(deployFixture);
        const [oldExample] = await deploy(false, "Example")
        await diamond.proxy(oldExample)
        const [newExample] = await deploy(false, "Example")
        await diamond.upgrade(oldExample.address, newExample)
        // assert
        const selector = (newExample as any as Example).interface.getFunction("setNumber").selector
        expect(await diamond.facetAddress(selector)).eq(newExample.address)
    });
});
