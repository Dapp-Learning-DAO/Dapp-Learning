const SimpleToken = artifacts.require("SimpleToken");

contract('SimpleToken', (accounts) => {
    it(`Should put 100000 to the ${accounts[0]}`, async () => {
        const simpleTokenIns = await SimpleToken.deployed();
        const balance = (await simpleTokenIns.balanceOf.call(accounts[0])).toNumber();

        assert.equal(balance, 100000, `the balance of ${accounts[0]} wasn not 100000`);
    });

    // change the a
    it('Transfer 100 to other account', async () => {
        const simpleTokenIns = await SimpleToken.deployed();

        // transfer 100 to other account
        await simpleTokenIns.transfer(accounts[1],1000);

        // check the balance of 0xFE63eDdC467E3E7bB6804ab21eAA18289355d02a
        const balance = (await simpleTokenIns.balanceOf.call(accounts[1])).toNumber();
        assert.equal(balance, 1000, `the balance of ${accounts[1]} wasn't 1000`);
    });

});

