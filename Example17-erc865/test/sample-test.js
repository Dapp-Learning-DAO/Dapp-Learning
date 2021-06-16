const { expect } = require("chai");

global.timestamp = Math.floor(Date.now() / 1000) + 20; // now + 60 seconds to allow for further testing when not allowed
const BigNumber = require('bignumber.js');
const ethUtil = require('ethereumjs-util');
//const utils = require('./utils');

const formattedAddress = address => Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
const formattedInt = int => ethUtil.setLengthLeft(int, 32);
const formattedBytes32 = bytes => ethUtil.addHexPrefix(bytes.toString('hex'));
const hashedTightPacked = args => ethUtil.keccak256(Buffer.concat(args));

  
 
  describe('ERC865 compatible logic', async () => {
    
    
    
    it('Charlie transfers 100 tokens from Alice to Bob (fee=10)', async () => {
      // give alice some props
      const [owner,alice,bob,charlie] =  await hre.ethers.getSigners();


      console.log("owner:" , owner.address);
      console.log("Alice:" , alice.address);
      console.log("Bob:" , bob.address);
      console.log("charlie:" , charlie.address);

      const to = bob.address;
      const delegate = charlie.address;
      const fee = 1;
      const amount = 10;
      const propsInWallet = 5000;
      const alicePrivateKey = Buffer.from("59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", 'hex');
       let wallet = new ethers.Wallet(alicePrivateKey);
       console.log("wallet address" , wallet.address)

      let components;
      let nonce;

      const Token = await ethers.getContractFactory("DToken");
      console.log("______________________")
      const hardhatToken = await Token.deploy("HEHE", "HH", 1, 100000000);
      console.log("Dtoken address :", hardhatToken.address);
      // Transfer 50 tokens from owner to addr1
      await hardhatToken.transfer(alice.address, propsInWallet);
      // nonce = await web3.eth.getTransactionCount(alice.address);
        nonce = 1;

      aliceBalance = await hardhatToken.balanceOf(alice.address);
      console.log("alice balance before: ", aliceBalance.toNumber());
      bobBalance = await hardhatToken.balanceOf(bob.address);
      console.log("bob balance before: ", bobBalance.toNumber());
      components = [
        Buffer.from('0d98dcb1', 'hex'),
        formattedAddress(hardhatToken.address),
        formattedAddress(to),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce),
      ];


      
      let messageHash = hashedTightPacked(components);
    
      const message_bytes = ethers.utils.arrayify(messageHash);
      // let hash = ethers.utils.solidityKeccak256(['string', 'bytes32'],
      //     ['\x19Ethereum Signed Message:\n32', messageHash]);
      console.log('message: ' + message_bytes);

      const sig = await wallet.signMessage(message_bytes);
      // alice send sig to charlie offline
      // charlie connect;
      
      console.log("alice off-sign successfully")
      

      let hardhatTokenCharlie = hardhatToken.connect(charlie);
      const txreceipt =await hardhatTokenCharlie.transferPreSigned(sig, to, amount, fee, nonce);
      const { events } = await txreceipt.wait();

      const args = events.find(({ event }) => event === 'TransferPreSigned').args
      console.log("args:", args)
      aliceBalance = await hardhatToken.balanceOf(alice.address);
      console.log("alice balance after: ", aliceBalance.toNumber());
      bobBalance = await hardhatToken.balanceOf(bob.address);
      charlieBalance = await hardhatToken.balanceOf(charlie.address);
      console.log("bob balance after: ", bobBalance.toNumber());

      //expect(await hardhatToken.balanceOf(addr2.address)).to.equal(50);
      expect(Number(aliceBalance)).to.equal(propsInWallet - (amount + fee));
      expect(Number(bobBalance)).to.equal(amount);
      expect(Number(charlieBalance)).to.equal(fee);
    })
   
  })

//     it('Charlie approves Damien to spend 100 tokens on behalf of Alice to Bob (fee=10)', async () => {
//       // give alice some props
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       const oldAliceBalance = aliceBalance;
//       const oldCharlieBalance = charlieBalance;
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('79250dcf', 'hex'),
//         formattedAddress(instance.address),
//         formattedAddress(damien.address),
//         formattedInt(amount),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
//       await instance.methods.approvePreSigned(
//           sig,
//           damien.address,
//           amount,
//           fee,
//           nonce).send(
//           { from: charlie.address , gas:1000000}
//       );
//
//       aliceBalance = await instance.methods.balanceOf(alice.address).call();
//       charlieBalance = await instance.methods.balanceOf(charlie.address).call();
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       assert.equal(Number(aliceBalance), Number(oldAliceBalance) - fee);
//       assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
//     });
//
//     it('Damien transfers half of approved tokens from Alice to Bob', async () => {
//       const oldAliceBalance = aliceBalance;
//       const oldBobBalance = bobBalance;
//       await instance.methods.transferFrom(alice.address, bob.address, amount / 2).send({ from: damien.address });
//       aliceBalance = await instance.methods.balanceOf(alice.address).call();
//       bobBalance = await instance.methods.balanceOf(bob.address).call();
//       assert.equal(Number(aliceBalance), Number(oldAliceBalance) - (amount / 2));
//       assert.equal(Number(bobBalance), Number(oldBobBalance) + (amount / 2));
//     });
//
//     it('Charlie performs transferFrom of 50 tokens on behalf of damien from Alice to Bob (fee=10)', async () => {
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       const oldAliceBalance = aliceBalance;
//       const oldBobBalance = bobBalance;
//       const oldCharlieBalance = charlieBalance;
//       const oldDamienBalance = await instance.methods.balanceOf(damien.address).call();
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[7]);
//       components = [
//         Buffer.from('a70c41b4', 'hex'),
//         formattedAddress(instance.address),
//         formattedAddress(alice.address),
//         formattedAddress(bob.address),
//         formattedInt(amount / 2),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//       // console.log(`components instance.address=${instance.address}, alice.address=${alice.address}, `)
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), Buffer.from(damien.pk, 'hex'));
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       await instance.methods.transferFromPreSigned(
//           sig,
//           alice.address,
//           bob.address,
//           amount / 2,
//           fee,
//           nonce).send(
//           { from: charlie.address, gas:1000000 }
//       );
//
//       aliceBalance = await instance.methods.balanceOf(alice.address).call();
//       bobBalance = await instance.methods.balanceOf(bob.address).call();
//       charlieBalance = await instance.methods.balanceOf(charlie.address).call();
//       damienBalance = await instance.methods.balanceOf(damien.address).call();
//
//       assert.equal(Number(aliceBalance), Number(oldAliceBalance) - ((amount / 2) + fee));
//       assert.equal(Number(bobBalance), Number(oldBobBalance) + (amount / 2));
//       assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
//     });
//
//     it('Charlie increase allowance of Damien to spend 100 tokens on behalf of Alice to Bob (fee=10)', async () => {
//       // give alice some props
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       const oldAliceBalance = aliceBalance;
//       const oldCharlieBalance = charlieBalance;
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('138e8da1', 'hex'),
//         formattedAddress(instance.address),
//         formattedAddress(damien.address),
//         formattedInt(amount),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
//       await instance.methods.increaseAllowancePreSigned(
//           sig,
//           damien.address,
//           amount,
//           fee,
//           nonce).send(
//           { from: charlie.address, gas:1000000 }
//       );
//
//       aliceBalance = await instance.methods.balanceOf(alice.address).call();
//       charlieBalance = await instance.methods.balanceOf(charlie.address).call();
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       assert.equal(Number(aliceBalance), Number(oldAliceBalance) - fee);
//       assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
//       const allowance = await instance.methods.allowance(alice.address, damien.address).call();
//       assert.equal(Number(allowance), amount);
//     });
//
//     it('Charlie decreases allowance of Damien to spend 50 tokens on behalf of Alice to Bob (fee=10)', async () => {
//       // give alice some props
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       const oldAliceBalance = aliceBalance;
//       const oldCharlieBalance = charlieBalance;
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('5229c56f', 'hex'),
//         formattedAddress(instance.address),
//         formattedAddress(damien.address),
//         formattedInt(amount / 2),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
//       await instance.methods.decreaseAllowancePreSigned(
//           sig,
//           damien.address,
//           amount / 2,
//           fee,
//           nonce).send(
//           { from: charlie.address, gas:1000000 }
//       );
//
//       aliceBalance = await instance.methods.balanceOf(alice.address).call();
//       charlieBalance = await instance.methods.balanceOf(charlie.address).call();
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       assert.equal(Number(aliceBalance), Number(oldAliceBalance) - fee);
//       assert.equal(Number(charlieBalance), Number(oldCharlieBalance) + fee);
//       const allowance = await instance.methods.allowance(alice.address, damien.address).call();
//       assert.equal(Number(allowance), amount / 2);
//     });
//
//     it('Charlie decreases allowance of Damien by 100 when only 50 are allowed is rejected', async () => {
//       // give alice some props
//       // console.log(`Balances: aliceBalance=${aliceBalance.toNumber()},bobBalance=${bobBalance.toNumber()},charlieBalance=${charlieBalance.toNumber()}`);
//       const oldAliceBalance = aliceBalance;
//       const oldCharlieBalance = charlieBalance;
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('5229c56f', 'hex'),
//         formattedAddress(instance.address),
//         formattedAddress(damien.address),
//         formattedInt(amount),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       // console.log(`${instance.address},${to},${amount},${fee},${nonce},${sig}`);
//       try {
//         expect(await instance.methods.decreaseAllowancePreSigned(
//             sig,
//             damien.address,
//             amount,
//             fee,
//             nonce).send(
//             { from: charlie.address, gas:1000000 }
//         )).to.be.rejectedWith(Error);
//       } catch (error) {
//         //
//       }
//     });
//     it('Charlie tries to transfer more tokens than alice has to Bob (fee=10)', async () => {
//
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('0d98dcb1', 'hex'),
//         formattedAddress(instance._address),
//         formattedAddress(to),
//         formattedInt(amount*1000000),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       try {
//         const tx = await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});
//         assert.equal(tx.receipt.status, '0x00');
//       } catch (error) {
//         // console.log(`error:${error}`);
//       }
//     });
//
//     it('Charlie tries to transfer tokens from alice has to no-one', async () => {
//
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('0d98dcb1', 'hex'),
//         formattedAddress(instance._address),
//         formattedAddress('0x0'),
//         formattedInt(amount),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       try {
//         const tx = await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});
//         assert.equal(tx.receipt.status, '0x00');
//       } catch (error) {
//         // console.log(`error:${error}`);
//       }
//     });
//
//     it('Charlie tries to transfer tokens with bad signature from alice to bob', async () => {
//
//       // nonce = await web3.eth.getTransactionCount(alice.address);
//       nonce = await web3.eth.getTransactionCount(web3.eth.accounts[9]);
//
//       components = [
//         Buffer.from('0d98dcb1', 'hex'),
//         formattedAddress(instance._address),
//         formattedAddress(to),
//         formattedInt(amount),
//         formattedInt(fee),
//         formattedInt(nonce),
//       ];
//
//       const vrs = ethUtil.ecsign(hashedTightPacked(components), Buffer.from(alice.pk, 'hex'));
//       const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
//       try {
//         const tx = await instance.methods.transferPreSigned(sig,to,amount,fee,nonce).send({ from: charlie.address, gas:1000000});
//         assert.equal(tx.receipt.status, '0x00');
//       } catch (error) {
//         // console.log(`error:${error}`);
//       }
//     });
//   });
// });
