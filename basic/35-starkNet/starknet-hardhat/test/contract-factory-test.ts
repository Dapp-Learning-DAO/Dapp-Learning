import { starknet } from "hardhat";

describe("ContractFactory", () => {
    it("should be created", async () => {
        await starknet.getContractFactory("contract");
    });
});
