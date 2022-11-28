const fs = require("fs");

async function main() {
  const DydxFlashloaner = await ethers.getContractFactory("DydxFlashloaner");

  const dydxFlashloaner = await DydxFlashloaner.deploy();

  console.log("contract deployed to:", dydxFlashloaner.address);

  // Writer Contract address to file
  const flashLoanAddressFile = __dirname + "/../DydxFlashloaner.json";
  fs.writeFileSync(
    flashLoanAddressFile,
    JSON.stringify({ address: dydxFlashloaner.address }, undefined, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });