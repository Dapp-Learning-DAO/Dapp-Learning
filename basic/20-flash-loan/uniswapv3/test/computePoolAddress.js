const { bytecode } = require('../artifacts/contracts/uniswap-v3-core/contracts/UniswapV3Pool.sol/UniswapV3Pool.json');
const { utils } = require('ethers');

exports.POOL_BYTECODE_HASH = utils.keccak256(bytecode)

exports.computePoolAddress = (factoryAddress, [tokenA, tokenB], fee) => {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
  const constructorArgumentsEncoded = utils.defaultAbiCoder.encode(
    ['address', 'address', 'uint24'],
    [token0, token1, fee]
  )
  const create2Inputs = [
    '0xff',
    factoryAddress,
    // salt
    utils.keccak256(constructorArgumentsEncoded),
    // init code hash
    exports.POOL_BYTECODE_HASH,
  ]
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`
  return utils.getAddress(`0x${utils.keccak256(sanitizedInputs).slice(-40)}`)
}