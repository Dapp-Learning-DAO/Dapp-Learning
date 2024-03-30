import { expect } from 'chai';
import { getWallet, deployContract, LOCAL_RICH_WALLETS } from '../deploy/utils';

describe('Greeter', function () {
  it("Should return the new greeting once it's changed", async function () {
    const wallet = getWallet(LOCAL_RICH_WALLETS[0].privateKey);

    const greeting = "Hello world!";
    const greeter = await deployContract("Greeter", [greeting], { wallet, silent: true });

    expect(await greeter.greet()).to.eq(greeting);

    const newGreeting = "Hola, mundo!";
    const setGreetingTx = await greeter.setGreeting(newGreeting);
    
    // wait until the transaction is processed
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal(newGreeting);
  });
});
