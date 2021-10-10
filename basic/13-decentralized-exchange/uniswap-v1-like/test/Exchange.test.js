require('@nomiclabs/hardhat-waffle');
const { BigNumber, utils, provider } = ethers;
const { expect } = require('chai');
const { getGasFeeFromTx } = require('../utils');

const toWei = (value) => utils.parseEther(value.toString());

const fromWei = (value) => utils.formatEther(typeof value === 'string' ? value : value.toString());

const getBalance = provider.getBalance;

const createExchange = async (factory, tokenAddress, sender) => {
  const exchangeAddress = await factory.connect(sender).callStatic.createExchange(tokenAddress);

  await factory.connect(sender).createExchange(tokenAddress);

  const Exchange = await ethers.getContractFactory('Exchange');

  return await Exchange.attach(exchangeAddress);
};

describe('Exchange', () => {
  let owner;
  let user;
  let exchange;
  let token;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy('Token', 'TKN', toWei(1000000));
    await token.deployed();

    const Exchange = await ethers.getContractFactory('Exchange');
    exchange = await Exchange.deploy(token.address);
    await exchange.deployed();
  });

  it('is deployed', async () => {
    expect(await exchange.deployed()).to.equal(exchange);
    expect(await exchange.name()).to.equal('Uniswap-V1-like');
    expect(await exchange.symbol()).to.equal('UNI-V1');
    expect(await exchange.totalSupply()).to.equal(toWei(0));
    expect(await exchange.factoryAddress()).to.equal(owner.address);
  });

  describe('addLiquidity', async () => {
    describe('empty reserves', async () => {
      it('adds liquidity', async () => {
        await token.approve(exchange.address, toWei(200));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });

        expect(await getBalance(exchange.address)).to.equal(toWei(100));
        expect(await exchange.getReserve()).to.equal(toWei(200));
      });

      it('mints LP tokens', async () => {
        await token.approve(exchange.address, toWei(200));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });

        expect(await exchange.balanceOf(owner.address)).to.eq(toWei(100));
        expect(await exchange.totalSupply()).to.eq(toWei(100));
      });

      it('allows zero amounts', async () => {
        await token.approve(exchange.address, 0);
        await exchange.addLiquidity(0, { value: 0 });

        expect(await getBalance(exchange.address)).to.equal(0);
        expect(await exchange.getReserve()).to.equal(0);
      });
    });

    describe('existing reserves', async () => {
      beforeEach(async () => {
        await token.approve(exchange.address, toWei(300));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });
      });

      it('preserves exchange rate', async () => {
        await exchange.addLiquidity(toWei(200), { value: toWei(50) });

        expect(await getBalance(exchange.address)).to.equal(toWei(150));
        expect(await exchange.getReserve()).to.equal(toWei(300));
      });

      it('mints LP tokens', async () => {
        await exchange.addLiquidity(toWei(200), { value: toWei(50) });

        expect(await exchange.balanceOf(owner.address)).to.eq(toWei(150));
        expect(await exchange.totalSupply()).to.eq(toWei(150));
      });

      it('fails when not enough tokens', async () => {
        await expect(exchange.addLiquidity(toWei(50), { value: toWei(50) })).to.be.revertedWith('insufficient token amount');
      });
    });
  });

  describe('removeLiquidity', async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toWei(300));
      await exchange.addLiquidity(toWei(200), { value: toWei(100) });
    });

    it('removes some liquidity', async () => {
      const amount = toWei(25);

      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      const tx = await exchange.removeLiquidity(amount);
      const gasFee = await getGasFeeFromTx(tx);

      expect(await exchange.getReserve()).to.equal(toWei(150));
      expect(await getBalance(exchange.address)).to.equal(toWei(75));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(userEtherBalanceAfter.sub(userEtherBalanceBefore)).to.equals(amount.sub(gasFee)); // the balance of eth has been cost gas fees

      expect(userTokenBalanceAfter.sub(userTokenBalanceBefore)).to.equals(toWei(50));
    });

    it('removes all liquidity', async () => {
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      const tx = await exchange.removeLiquidity(toWei(100));
      const gasFee = await getGasFeeFromTx(tx)

      expect(await exchange.getReserve()).to.equal(toWei(0));
      expect(await getBalance(exchange.address)).to.equal(toWei(0));

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(userEtherBalanceAfter.sub(userEtherBalanceBefore)).to.equal(toWei(100).sub(gasFee)); // 100 - gas fees

      expect(fromWei(userTokenBalanceAfter.sub(userTokenBalanceBefore))).to.equal('200.0');
    });

    it('pays for provided liquidity', async () => {
      const amount = toWei(100);
      const userEtherBalanceBefore = await getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchange.connect(user).ethToTokenSwap(toWei(18), { value: toWei(10) });

      const tx = await exchange.removeLiquidity(amount);
      const gasFee = await getGasFeeFromTx(tx);

      expect(await exchange.getReserve()).to.equal(toWei(0));
      expect(await getBalance(exchange.address)).to.equal(toWei(0));
      expect(fromWei(await token.balanceOf(user.address))).to.equal('18.01637852593266606');

      const userEtherBalanceAfter = await getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);
      
      // user will receive eth 100 + 10 - gas fees
      expect(userEtherBalanceAfter.sub(userEtherBalanceBefore)).to.equals(toWei(110).sub(gasFee));

      expect(fromWei(userTokenBalanceAfter.sub(userTokenBalanceBefore))).to.equal('181.98362147406733394');
    });

    it('burns LP-tokens', async () => {
      await expect(() => exchange.removeLiquidity(toWei(25))).to.changeTokenBalance(exchange, owner, toWei(-25));

      expect(await exchange.totalSupply()).to.equal(toWei(75));
    });

    it("doesn't allow invalid amount", async () => {
      await expect(exchange.removeLiquidity(toWei(100.1))).to.be.revertedWith('burn amount exceeds balance');
    });
  });

  describe('getTokenAmount', async () => {
    it('returns correct token amount', async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      let tokensOut = await exchange.getTokenAmount(toWei(1));
      expect(fromWei(tokensOut)).to.equal('1.978041738678708079');

      tokensOut = await exchange.getTokenAmount(toWei(100));
      expect(fromWei(tokensOut)).to.equal('180.1637852593266606');

      tokensOut = await exchange.getTokenAmount(toWei(1000));
      expect(fromWei(tokensOut)).to.equal('994.974874371859296482');
    });
  });

  describe('getEthAmount', async () => {
    it('returns correct ether amount', async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      let ethOut = await exchange.getEthAmount(toWei(2));
      expect(fromWei(ethOut)).to.equal('0.989020869339354039');

      ethOut = await exchange.getEthAmount(toWei(100));
      expect(fromWei(ethOut)).to.equal('47.16531681753215817');

      ethOut = await exchange.getEthAmount(toWei(2000));
      expect(fromWei(ethOut)).to.equal('497.487437185929648241');
    });
  });

  describe('ethToTokenTransfer', async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it('transfers at least min amount of tokens to recipient', async () => {
      const userBalanceBefore = await getBalance(user.address);

      const tx = await exchange.connect(user).ethToTokenTransfer(toWei(1.97), user.address, { value: toWei(1) });
      const gasFee = await getGasFeeFromTx(tx)

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceBefore.sub(userBalanceAfter)).to.equal(toWei(1).add(gasFee));

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('1.978041738678708079');

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal('1001.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal('1998.021958261321291921');
    });
  });

  describe('ethToTokenSwap', async () => {
    beforeEach(async () => {
      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it('transfers at least min amount of tokens', async () => {
      const userBalanceBefore = await getBalance(user.address);

      const tx = await exchange.connect(user).ethToTokenSwap(toWei(1.97), { value: toWei(1) });
      const gasFee = await getGasFeeFromTx(tx)

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceBefore.sub(userBalanceAfter)).to.equal(toWei(1).add(gasFee));

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('1.978041738678708079');

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal('1001.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal('1998.021958261321291921');
    });

    it('affects exchange rate', async () => {
      let tokensOut = await exchange.getTokenAmount(toWei(10));
      expect(fromWei(tokensOut)).to.equal('19.605901574413308248');

      await exchange.connect(user).ethToTokenSwap(toWei(9), { value: toWei(10) });

      tokensOut = await exchange.getTokenAmount(toWei(10));
      expect(fromWei(tokensOut)).to.equal('19.223356774598792281');
    });

    it('fails when output amount is less than min amount', async () => {
      await expect(exchange.connect(user).ethToTokenSwap(toWei(2), { value: toWei(1) })).to.be.revertedWith('insufficient output amount');
    });

    it('allows zero swaps', async () => {
      await exchange.connect(user).ethToTokenSwap(toWei(0), { value: toWei(0) });

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('0.0');

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal('1000.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal('2000.0');
    });
  });

  describe('tokenToEthSwap', async () => {
    beforeEach(async () => {
      await token.transfer(user.address, toWei(22));
      await token.connect(user).approve(exchange.address, toWei(22));

      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it('transfers at least min amount of tokens', async () => {
      const minAmount = toWei(0.9)
      const userBalanceBefore = await getBalance(user.address);
      const exchangeBalanceBefore = await getBalance(exchange.address);

      const tx = await exchange.connect(user).tokenToEthSwap(toWei(2), minAmount);
      const gasFee = await getGasFeeFromTx(tx)

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceAfter.sub(userBalanceBefore).gte(minAmount)).to.equals(true)

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('20.0');

      const exchangeBalanceAfter = await getBalance(exchange.address);
      expect(exchangeBalanceBefore.sub(exchangeBalanceAfter).gte(minAmount)).to.equals(true)

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal('2002.0');
    });

    it('affects exchange rate', async () => {
      let ethOut = await exchange.getEthAmount(toWei(20));
      expect(fromWei(ethOut)).to.equal('9.802950787206654124');

      await exchange.connect(user).tokenToEthSwap(toWei(20), toWei(9));

      ethOut = await exchange.getEthAmount(toWei(20));
      expect(fromWei(ethOut)).to.equal('9.61167838729939614');
    });

    it('fails when output amount is less than min amount', async () => {
      await expect(exchange.connect(user).tokenToEthSwap(toWei(2), toWei(1.0))).to.be.revertedWith('insufficient output amount');
    });

    it('allows zero swaps', async () => {
      const userBalanceBefore = await getBalance(user.address);
      const tx = await exchange.connect(user).tokenToEthSwap(toWei(0), toWei(0));
      const gasFee = await getGasFeeFromTx(tx)

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceBefore.sub(userBalanceAfter)).to.equal(gasFee);

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('22.0');

      const exchangeEthBalance = await getBalance(exchange.address);
      expect(fromWei(exchangeEthBalance)).to.equal('1000.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.address);
      expect(fromWei(exchangeTokenBalance)).to.equal('2000.0');
    });
  });

  describe('tokenToTokenSwap', async () => {
    it('swaps token for token', async () => {
      const Factory = await ethers.getContractFactory('Factory');
      const Token = await ethers.getContractFactory('Token');

      const factory = await Factory.deploy();
      const token = await Token.deploy('TokenA', 'AAA', toWei(1000000));
      const token2 = await Token.connect(user).deploy('TokenB', 'BBBB', toWei(1000000));

      await factory.deployed();
      await token.deployed();
      await token2.deployed();

      const exchange = await createExchange(factory, token.address, owner);
      const exchange2 = await createExchange(factory, token2.address, user);

      await token.approve(exchange.address, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      await token2.connect(user).approve(exchange2.address, toWei(1000));
      await exchange2.connect(user).addLiquidity(toWei(1000), { value: toWei(1000) });

      expect(await token2.balanceOf(owner.address)).to.equal(0);

      await token.approve(exchange.address, toWei(10));
      await exchange.tokenToTokenSwap(toWei(10), toWei(4.8), token2.address);

      expect(fromWei(await token2.balanceOf(owner.address))).to.equal('4.852698493489877956');

      expect(await token.balanceOf(user.address)).to.equal(0);

      await token2.connect(user).approve(exchange2.address, toWei(10));
      await exchange2.connect(user).tokenToTokenSwap(toWei(10), toWei(19.6), token.address);

      expect(fromWei(await token.balanceOf(user.address))).to.equal('19.602080509528011079');
    });
  });
});
