import { expect } from "chai";
import { starknet } from "hardhat";
import { pedersen, ec, sign } from "@toruslabs/starkware-crypto"
import { TIMEOUT } from "./constants";

describe("Starknet", function () {
  this.timeout(TIMEOUT);

  it("should handle signing transactions with previously calculated hashes", async function() {
    // assumes auth_contract.cairo has been compiled
    const authContractFactory = await starknet.getContractFactory("auth_contract");


    // be sure to pass big numbers as strings to avoid precision errors
    const publicKey = BigInt("1628448741648245036800002906075225705100596136133912895015035902954123957052");
    const authContract = await authContractFactory.deploy({
      lucky_user: publicKey,
      initial_balance: 1000
    });
    console.log("Deployed authContract at", authContract.address);

    const signature = [// previously calculated for amount and publicKey used in this case
      BigInt("1225578735933442828068102633747590437426782890965066746429241472187377583468"),
      BigInt("3568809569741913715045370357918125425757114920266578211811626257903121825123")
    ];

    await authContract.invoke("increase_balance", {
      user: publicKey,
      amount: 4321
    }, signature);

    const { res: balance } = await authContract.call("get_balance", {
      user: publicKey
    });
    expect(balance).to.deep.equal(5321n);
  });

  it("should handle signing transactions using the starkware-crypto library", async function() {
    // assumes auth_contract.cairo has been compiled
    const authContractFactory = await starknet.getContractFactory("auth_contract");

    const amount = 4321;
    // be sure to pass big numbers as strings to avoid precision errors
    const privateKey = BigInt("1628448741648245036800002906075225705100596136133912895015035902954123957052");
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    const publicKey = ec.keyFromPublic(keyPair.getPublic(true, 'hex'), 'hex').pub.getX().toString(16);
    const publicKeyFelt = BigInt("0x" + publicKey)
    const authContract = await authContractFactory.deploy({
      lucky_user: publicKeyFelt,
      initial_balance: 1000
    });
    console.log("Deployed authContract at", authContract.address);

    const messageHash = pedersen([amount,0]);
    const signedMessage = sign(keyPair, messageHash);
    const signature = [// previously calculated for amount and publicKey used in this case
      BigInt("0x" + signedMessage.r.toString(16)),
      BigInt("0x" + signedMessage.s.toString(16))
    ];

    await authContract.invoke("increase_balance", {
      user: publicKeyFelt,
      amount: amount
    }, signature);

    const { res: balance } = await authContract.call("get_balance", {
      user: publicKeyFelt
    });
    expect(balance).to.deep.equal(5321n);
  });
});
