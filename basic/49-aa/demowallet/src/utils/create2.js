const {ethers} = require("ethers");

const HEADER = 0xff;

function computeAddress(deployer, initCode, salt) {
    salt = ethers.utils.hexZeroPad(salt, 32);

    const preimage = ethers.utils.hexConcat([
        HEADER,
        deployer,
        salt,
        ethers.utils.keccak256(initCode)
    ]);

    const predictedAddr = "0x" + ethers.utils.keccak256(preimage).slice(-40);
    return predictedAddr;

}

module.exports = {
    computeAddress
}