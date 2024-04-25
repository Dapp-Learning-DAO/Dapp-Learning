const { expect } = require('chai');
const hre = require('hardhat');
const ethers = hre.ethers;

const { getGasFeeFromTx } = require('../utils');
const { getAddress } = require('ethers');

const toWei = (value) => ethers.parseEther(value.toString());

const fromWei = (value) =>
  ethers.formatEther(typeof value === 'string' ? value : value.toString());

const getBalance = async (value) =>
  await ethers.provider.getBalance(value);

const createExchange = async (factory, tokenAddress, sender) => {

  console.log(tokenAddress, sender.address);
  const exchangeAddress = await factory.connect(sender).createExchange(tokenAddress);
  exchangeAddress.wait();

  const address = await factory.connect(sender).getExchange(tokenAddress);
  console.log("token address-" + tokenAddress + "-exchange address-" + address);
  const Exchange = await ethers.getContractFactory('Exchange');
  return Exchange.attach(address);
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

    const Exchange = await ethers.getContractFactory('Exchange');
    exchange = await Exchange.deploy(token.target);
  });

  it('is deployed', async () => {

    expect(await exchange.name()).to.equal('Uniswap-V1-like');

    expect(await exchange.symbol()).to.equal('UNI-V1');

    expect(await exchange.totalSupply()).to.equal(toWei(0));

    expect(await exchange.factoryAddress()).to.equal(owner.address);
  });

  describe('addLiquidity', async () => {
    describe('empty reserves', async () => {
      it('adds liquidity', async () => {
        await token.approve(exchange.target, toWei(200));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });
        expect(await getBalance(exchange.target)).to.equal(toWei(100));
        expect(await exchange.getReserve()).to.equal(toWei(200));
      });

      it('mints LP tokens', async () => {
        await token.approve(exchange.target, toWei(200));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });
        const  a = await exchange.balanceOf(owner.address);
        expect(await exchange.balanceOf(owner.address)).to.eq(toWei(100));
        expect(await exchange.totalSupply()).to.eq(toWei(100));
      });

      it('allows zero amounts', async () => {
        await token.approve(exchange.target, 0);
        await exchange.addLiquidity(0, { value: 0 });

        expect(await ethers.provider.getBalance(exchange.target)).to.equal(0);
        expect(await exchange.getReserve()).to.equal(0);
      });
    });

    describe('existing reserves', async () => {
      beforeEach(async () => {
        await token.approve(exchange.target, toWei(300));
        await exchange.addLiquidity(toWei(200), { value: toWei(100) });
      });

      it('preserves exchange rate', async () => {
        await exchange.addLiquidity(toWei(200), { value: toWei(50) });

        expect(await ethers.provider.getBalance(exchange.target)).to.equal(toWei(150));
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
      await token.approve(exchange.target, toWei(300));
      await exchange.addLiquidity(toWei(200), { value: toWei(100) });
    });

    it('removes some liquidity', async () => {
      const amount = toWei(25);

      const userEtherBalanceBefore = await ethers.provider.getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      const tx = await exchange.removeLiquidity(amount);
      const gasFee = await getGasFeeFromTx(tx);

      expect(await exchange.getReserve()).to.equal(toWei(150));
      expect(await ethers.provider.getBalance(exchange.target)).to.equal(toWei(75));

      const userEtherBalanceAfter = await ethers.provider.getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(userEtherBalanceAfter - userEtherBalanceBefore).to.equals(amount - gasFee); // the balance of eth has been cost gas fees

      expect(userTokenBalanceAfter - userTokenBalanceBefore).to.equals(toWei(50));
    });

    it('removes all liquidity', async () => {
      const userEtherBalanceBefore = await ethers.provider.getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      const tx = await exchange.removeLiquidity(toWei(100));
      const gasFee = await getGasFeeFromTx(tx)

      expect(await exchange.getReserve()).to.equal(toWei(0));
      expect(await ethers.provider.getBalance(exchange.target)).to.equal(toWei(0));

      const userEtherBalanceAfter = await ethers.provider.getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      expect(userEtherBalanceAfter - userEtherBalanceBefore).to.equal(toWei(100) - gasFee ); // 100 - gas fees

      expect(fromWei(userTokenBalanceAfter - userTokenBalanceBefore)).to.equal('200.0');
    });

    it('pays for provided liquidity', async () => {
      const amount = toWei(100);
      const userEtherBalanceBefore = await ethers.provider.getBalance(owner.address);
      const userTokenBalanceBefore = await token.balanceOf(owner.address);

      await exchange.connect(user).ethToTokenSwap(toWei(18), { value: toWei(10) });

      const tx = await exchange.removeLiquidity(amount);
      const gasFee = await getGasFeeFromTx(tx);

      expect(await exchange.getReserve()).to.equal(toWei(0));
      expect(await ethers.provider.getBalance(exchange.target)).to.equal(toWei(0));
      expect(fromWei(await token.balanceOf(user.address))).to.equal('18.01637852593266606');

      const userEtherBalanceAfter = await ethers.provider.getBalance(owner.address);
      const userTokenBalanceAfter = await token.balanceOf(owner.address);

      // user will receive eth 100 + 10 - gas fees
      expect(userEtherBalanceAfter - userEtherBalanceBefore).to.equals(toWei(110) - gasFee);

      expect(fromWei(userTokenBalanceAfter - userTokenBalanceBefore)).to.equal('181.98362147406733394');
    });

    it('burns LP-tokens', async () => {
      await expect(() => exchange.removeLiquidity(toWei(25))).to.changeTokenBalance(exchange, owner, toWei(-25));

      expect(await exchange.totalSupply()).to.equal(toWei(75));
    });

    it("doesn't allow invalid amount", async () => {
      await expect(exchange.removeLiquidity(toWei(100.1))).to.be.revertedWith('ERC20: burn amount exceeds balance');
    });
  });

  describe('getTokenAmount', async () => {
    it('returns correct token amount', async () => {
      await token.approve(exchange.target, toWei(2000));
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
      await token.approve(exchange.target, toWei(2000));
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
      await token.approve(exchange.target, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it('transfers at least min amount of tokens to recipient', async () => {
      const userBalanceBefore = await getBalance(user.address);

      const tx = await exchange.connect(user).ethToTokenTransfer(toWei(1.97), user.address, { value: toWei(1) });
      const gasFee = await getGasFeeFromTx(tx)

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceBefore - userBalanceAfter).to.equal(toWei(1) + gasFee);

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('1.978041738678708079');

      const exchangeEthBalance = await getBalance(exchange.target);
      expect(fromWei(exchangeEthBalance)).to.equal('1001.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.target);
      expect(fromWei(exchangeTokenBalance)).to.equal('1998.021958261321291921');
    });
  });

  describe('ethToTokenSwap', async () => {
    beforeEach(async () => {
      await token.approve(exchange.target, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it('transfers at least min amount of tokens', async () => {
      const userBalanceBefore = await getBalance(user.address);

      const tx = await exchange.connect(user).ethToTokenSwap(toWei(1.97), { value: toWei(1) });
      const gasFee = await getGasFeeFromTx(tx)

      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceBefore - userBalanceAfter).to.equal(toWei(1n)  + gasFee);

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('1.978041738678708079');

      const exchangeEthBalance = await ethers.provider.getBalance(exchange.target);
      expect(fromWei(exchangeEthBalance)).to.equal('1001.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.target);
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

      const exchangeEthBalance = await ethers.provider.getBalance(exchange.target);
      expect(fromWei(exchangeEthBalance)).to.equal('1000.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.target);
      expect(fromWei(exchangeTokenBalance)).to.equal('2000.0');
    });
  });

  describe('tokenToEthSwap', async () => {
    beforeEach(async () => {
      await token.transfer(user.address, toWei(22));
      await token.connect(user).approve(exchange.target, toWei(22));

      await token.approve(exchange.target, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });
    });

    it('transfers at least min amount of tokens', async () => {
      const minAmount = toWei(0.9)
      const userBalanceBefore = await getBalance(user.address);
      const exchangeBalanceBefore = await ethers.provider.getBalance(exchange.target);

      const tx = await exchange.connect(user).tokenToEthSwap(toWei(2), minAmount);
      const gasFee = await getGasFeeFromTx(tx)
      const userBalanceAfter = await getBalance(user.address);
      expect(userBalanceAfter - userBalanceBefore).to.be.gt(minAmount);
      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('20.0');

      const exchangeBalanceAfter = await ethers.provider.getBalance(exchange.target);
      expect(exchangeBalanceBefore - exchangeBalanceAfter).to.be.gt(minAmount);

      const exchangeTokenBalance = await token.balanceOf(exchange.target);
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
      expect(userBalanceBefore - userBalanceAfter).to.equal(gasFee);

      const userTokenBalance = await token.balanceOf(user.address);
      expect(fromWei(userTokenBalance)).to.equal('22.0');

      const exchangeEthBalance = await ethers.provider.getBalance(exchange.target);
      expect(fromWei(exchangeEthBalance)).to.equal('1000.0');

      const exchangeTokenBalance = await token.balanceOf(exchange.target);
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

      await factory.waitForDeployment();
      await token.waitForDeployment();
      await token2.waitForDeployment();

      const exchange = await createExchange(factory, token.target, owner);
      console.log("exchange address" + exchange.target);
      const exchange2 = await createExchange(factory, token2.target, user);
      console.log("exchange2 address" + exchange2.target);

      await token.approve(exchange.target, toWei(2000));
      await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

      await token2.connect(user).approve(exchange2.target, toWei(1000));
      await exchange2.connect(user).addLiquidity(toWei(1000), { value: toWei(1000) });

      expect(await token2.balanceOf(owner.address)).to.equal(0);

      await token.approve(exchange.target, toWei(10));

      console.log(exchange.target)
      console.log(fromWei(await token2.allowance(user.address,exchange.target)) + "query approve");

      await exchange.connect(owner).tokenToTokenSwap(toWei(10), toWei(4.8), token2.target);

      expect(fromWei(await token2.balanceOf(owner.address))).to.equal('4.852698493489877956');

      expect(await token.balanceOf(user.address)).to.equal(0);

      await token2.connect(user).approve(exchange2.target, toWei(10));
      await exchange2.connect(user).tokenToTokenSwap(toWei(10), toWei(19.6), token.target);

      expect(fromWei(await token.balanceOf(user.address))).to.equal('19.602080509528011079');
    });
  });
});
