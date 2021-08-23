async function main() {
  const DydxFlashloaner = await ethers.getContractFactory("DydxFlashloaner");

  const dydxFlashloaner = await DydxFlashloaner.deploy();

  console.log("contract deployed to:", dydxFlashloaner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });