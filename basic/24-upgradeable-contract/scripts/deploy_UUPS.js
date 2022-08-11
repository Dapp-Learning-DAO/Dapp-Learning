// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, upgrades } = require("hardhat");

// todo 
async function main() {
 
  let [alice] = await ethers.getSigners();
  console.log(alice.address);
  
    const MyLogicV1 = await ethers.getContractFactory('MyLogicV1');
    
      myLogicV1 = await upgrades.deployProxy(MyLogicV1, {kind: 'uups'});
      console.log(myLogicV1.address);

 
      await myLogicV1.SetLogic("aa", 1);
      let value = await myLogicV1.GetLogic("aa");
      console.log(value)
      const MyLogicV2 = await ethers.getContractFactory('MyLogicV2');


      myLogicV2 =  await upgrades.upgradeProxy(myLogicV1, MyLogicV2);
      console.log(myLogicV2.address);
  
     let value1 = await myLogicV2.GetLogic("aa");
  
     console.log(value1)


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
