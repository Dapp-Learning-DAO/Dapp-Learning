const { expect } = require("chai");
const { BigNumber } = require("@ethersproject/bignumber");

describe("Freelancer", function() {
  it("Freelancer Test", async function() {
    const [Alice, Bob] = await ethers.getSigners();

    const freelancerFactory = await ethers.getContractFactory("Freelancer");
    const freelancerContractAlice = await freelancerFactory.deploy();
    
    await freelancerContractAlice.deployed();
    
    // Programmer add task
    await freelancerContractAlice.addSchedule("DSP", "Design Phase", ethers.utils.parseEther("0.25"));

    // Client accept the project
    let freelancerContractBob = freelancerContractAlice.connect(Bob);
    await freelancerContractBob.acceptProject();

    // Client funds for task
    let overrides = {
      // To convert Ether to Wei:
      value: ethers.utils.parseEther("0.25")     // ether in this case MUST be a string
  
      // Or you can use Wei directly if you have that:
      // value: someBigNumber
      // value: 1234   // Note that using JavaScript numbers requires they are less than Number.MAX_SAFE_INTEGER
      // value: "1234567890"
      // value: "0x1234"
  
      // Or, promises are also supported:
      // value: provider.getBalance(addr)
  };
    await freelancerContractBob.fundTask(0,overrides);

    // Check balance
    expect(await freelancerContractBob.getBalance()).to.equal(ethers.utils.parseEther("0.25"));
  
    // Programmer start task 
    await freelancerContractAlice.startTask(0);

    // Client approve task 
    await freelancerContractBob.approveTask(0);

    // Programmer releaseFunds 
    await freelancerContractAlice.releaseFunds(0);
    expect(await freelancerContractBob.getBalance()).to.equal(ethers.utils.parseEther("0"));

    // End project
    await freelancerContractAlice.endProject();
  });
});
