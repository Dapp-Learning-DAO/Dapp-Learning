let Flashloan = artifacts.require("Flashloan")

module.exports = async function(deployer, network) {
  try {
    let lendingPoolProviderAddr;

    switch (network) {
      case "mainnet":
      case "mainnet-fork":
      case "development": // For Ganache mainnet forks
        lendingPoolProviderAddr = "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8";
        break
      case "ropsten":
      case "ropsten-fork":
        lendingPoolProviderAddr = "0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728";
        break
      case "kovan":
      case "kovan-fork":
        lendingPoolProviderAddr = "0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5";
        break
      default:
        throw Error(`Are you deploying to the correct network? (network selected: ${network})`)
    }

    await deployer.deploy(Flashloan, lendingPoolProviderAddr)
  }
  catch (e) {
    console.log(`Error in migration: ${e.message}`)
  }
}
