// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
  // This is just a convenience check
  if (network.name === 'hardhat') {
    console.warn(
      'You are trying to deploy a contract to the Hardhat Network, which' +
        'gets automatically created and destroyed every time. Use the Hardhat' +
        " option '--network localhost'"
    )
  }

  // ethers is avaialble in the global scope
  const [deployer] = await ethers.getSigners()
  console.log(
    'Deploying the contracts with the account:',
    await deployer.getAddress()
  )

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const Token = await ethers.getContractFactory('SimpleToken')
  const token = await Token.deploy('Hello', 'Token', 1, 10000)
  await token.deployed()

  console.log('SimpleToken address:', token.address)

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, deployer)
}

function saveFrontendFiles(token, deployerAccount) {
  const fs = require('fs')
  const contractsDir = __dirname + '/../frontend/src/contracts'

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir)
  }

  fs.writeFileSync(
    contractsDir + '/contract-address.json',
    JSON.stringify({ contractAddress: token.address }, undefined, 2)
  )

  const TokenArtifact = artifacts.readArtifactSync('SimpleToken')

  fs.writeFileSync(
    contractsDir + '/SimpleToken.json',
    JSON.stringify(TokenArtifact, null, 2)
  )

  fs.writeFileSync(
    contractsDir + '/deployer.json',
    JSON.stringify({ deployer: deployerAccount }, undefined, 2)
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
