describe("Hello test",function(){
  it("test function of Hello.sol",async function(){
    //测试账号数组
    const HelloContractFactory = await ethers.getContractFactory("Hello");
    const hello = await HelloContractFactory.deploy();
    await hello.deployed();
    console.log("address of hello:",hello.address);

    //在多签钱包添加一笔交易
    const tokenArtifact = await hre.artifacts.readArtifact("Hello");
    console.log("abi of hello:",tokenArtifact.abi);
  });
});

