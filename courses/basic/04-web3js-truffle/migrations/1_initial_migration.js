const SimpleToken = artifacts.require("SimpleToken");

module.exports = function(deployer) {
  deployer.deploy(SimpleToken,"Hello","SimpleToken",1,10000);
};
