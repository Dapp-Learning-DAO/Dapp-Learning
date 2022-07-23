// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");

const Path_prefix = __dirname + "/../../abi/";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let SimpleToken = artifacts.readArtifactSync("SimpleToken");

  // Check wether dir is exist, if not creat it
  !fs.existsSync(Path_prefix) && fs.mkdirSync(Path_prefix);

  // Write file to target dir
  writeFile(SimpleToken);

}

function writeFile(SimpleToken) {
  fs.writeFileSync(
    Path_prefix + "SimpleToken.json",
    JSON.stringify(SimpleToken.abi)
  );

  fs.writeFileSync(
    Path_prefix + "SimpleToken.code",
    SimpleToken.bytecode
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
