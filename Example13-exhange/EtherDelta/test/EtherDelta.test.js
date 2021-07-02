require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");

const { BigNumber, utils, provider } = ethers;

const toWei = (value) => utils.parseEther(value.toString());
const fromWei = (value) =>
  utils.formatEther(typeof value === "string" ? value : value.toString());

const getBalance = provider.getBalance;

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("EtherDelta", () => {
  let feeAccount;
  let admin;
  let feeMake;
  let feeTake;
  let feeRebate;

  let token1;
  let token2;
  let accountLevelsTest;
  let etherDelta;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    feeAccount = owner.address;
    admin = owner.address;
    // 费率先toWei,后面需要再除以 toWei，保证整数运算
    feeMake = toWei(0.0005); // 买家佣金费率
    feeTake = toWei(0.003); // 卖家佣金费率
    feeRebate = toWei(0.002); // 会员反佣费率

    // ReserveToken
    const ReserveToken = await ethers.getContractFactory("ReserveToken");
    // token1
    token1 = await ReserveToken.deploy();
    await token1.deployed();
    // token2
    token2 = await ReserveToken.deploy();
    await token2.deployed();

    // AccountLevelsTest
    const AccountLevelsTest = await ethers.getContractFactory(
      "AccountLevelsTest"
    );
    accountLevelsTest = await AccountLevelsTest.deploy();
    await accountLevelsTest.deployed();

    const EtherDelta = await ethers.getContractFactory("EtherDelta");
    // [admin, feeAccount, contractAccountLevelsAddr, feeMake, feeTake, feeRebate]
    etherDelta = await EtherDelta.deploy(
      admin,
      feeAccount,
      accountLevelsTest.address,
      feeMake,
      feeTake,
      feeRebate
    );
    await etherDelta.deployed();
  });

  it("is deployed", async () => {
    expect(await token1.deployed()).to.equal(token1);
    expect(await token2.deployed()).to.equal(token2);
    expect(await accountLevelsTest.deployed()).to.equal(accountLevelsTest);
    expect(await etherDelta.deployed()).to.equal(etherDelta);
  });

  it("Should mint some tokens", async () => {
    const amount = toWei(10000);

    // token1
    await token1.create(user1.address, amount);
    expect(await token1.balanceOf(user1.address)).to.equal(amount);
    expect(await token1.totalSupply()).to.equal(amount);

    // token2
    await token2.create(user1.address, amount);
    expect(await token2.balanceOf(user1.address)).to.equal(amount);
    expect(await token2.totalSupply()).to.equal(amount);
  });

  it("Should add funds to etherdelta", async () => {
    const amount = toWei(1000);

    // deposit eth
    await etherDelta.connect(user1).deposit({ value: amount });
    expect(await etherDelta.balanceOf(ADDRESS_ZERO, user1.address)).to.equal(
      amount
    );

    // depsit token1
    await token1.create(user1.address, amount);
    await token1.connect(user1).approve(etherDelta.address, amount);
    await etherDelta.connect(user1).depositToken(token1.address, amount);
    expect(await etherDelta.balanceOf(token1.address, user1.address)).to.equal(
      amount
    );

    // depsit token2
    await token2.create(user1.address, amount);
    await token2.connect(user1).approve(etherDelta.address, amount);
    await etherDelta.connect(user1).depositToken(token2.address, amount);
    expect(await etherDelta.balanceOf(token2.address, user1.address)).to.equal(
      amount
    );
  });

  async function prepareTokens() {
    const _tokenAmountInit = toWei(100000);
    await token1.create(user1.address, _tokenAmountInit);
    await token1.connect(user1).approve(etherDelta.address, _tokenAmountInit);
    await etherDelta
      .connect(user1)
      .depositToken(token1.address, _tokenAmountInit);
    await token2.create(user1.address, _tokenAmountInit);
    await token2.connect(user1).approve(etherDelta.address, _tokenAmountInit);
    await etherDelta
      .connect(user1)
      .depositToken(token2.address, _tokenAmountInit);
    await token1.create(user2.address, _tokenAmountInit);
    await token1.connect(user2).approve(etherDelta.address, _tokenAmountInit);
    await etherDelta
      .connect(user2)
      .depositToken(token1.address, _tokenAmountInit);
    await token2.create(user2.address, _tokenAmountInit);
    await token2.connect(user2).approve(etherDelta.address, _tokenAmountInit);
    await etherDelta
      .connect(user2)
      .depositToken(token2.address, _tokenAmountInit);
  }

  it("Should do some trades initiated onchain", async () => {
    await prepareTokens();

    async function testTrade(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
      accountLevel
    ) {
      let expires = expiresIn;
      const blockNumber = await ethers.provider.getBlockNumber();
      expires = expiresIn + blockNumber;

      const hash = utils.solidityPack(
        [
          "address",
          "address",
          "uint256",
          "address",
          "uint256",
          "uint256",
          "uint256",
        ],
        [
          etherDelta.address,
          tokenGet,
          amountGet,
          tokenGive,
          amountGive,
          expires,
          orderNonce,
        ]
      );

      const signature = await user2.signMessage(hash);
      // console.log('signature ', signature.length, signature )
      const r = signature.slice(0, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = "0x" + signature.slice(130, 132);

      await accountLevelsTest.setAccountLevel(user1.address, accountLevel);
      const level = await accountLevelsTest.accountLevel(user1.address);

      const initialFeeBalance1 = await etherDelta.balanceOf(
        token1.address,
        feeAccount
      );
      const initialFeeBalance2 = await etherDelta.balanceOf(
        token2.address,
        feeAccount
      );

      const initialBalance11 = await etherDelta.balanceOf(
        token1.address,
        user1.address
      );
      const initialBalance12 = await etherDelta.balanceOf(
        token1.address,
        user2.address
      );

      const initialBalance21 = await etherDelta.balanceOf(
        token2.address,
        user1.address
      );
      const initialBalance22 = await etherDelta.balanceOf(
        token2.address,
        user2.address
      );

      await etherDelta
        .connect(user1)
        .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);
      await etherDelta
        .connect(user2)
        .trade(
          tokenGet,
          amountGet,
          tokenGive,
          amountGive,
          expires,
          orderNonce,
          user1.address,
          v,
          r,
          s,
          amount
        );

      const feeBalance1 = await etherDelta.balanceOf(
        token1.address,
        feeAccount
      );
      const feeBalance2 = await etherDelta.balanceOf(
        token2.address,
        feeAccount
      );

      const balance11 = await etherDelta.balanceOf(
        token1.address,
        user1.address
      );
      const balance12 = await etherDelta.balanceOf(
        token1.address,
        user2.address
      );

      const balance21 = await etherDelta.balanceOf(
        token2.address,
        user1.address
      );
      const balance22 = await etherDelta.balanceOf(
        token2.address,
        user2.address
      );

      const volume = {
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        nonce: orderNonce,
        user: user1.address,
        v,
        r,
        s,
      };
      const availableVolume = await etherDelta.availableVolume(volume);
      expect(availableVolume).to.equal(amountGet.sub(amount));

      const amountFilled = await etherDelta.amountFilled(
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        orderNonce,
        user1.address,
        v,
        r,
        s
      );
      expect(amountFilled).to.equal(amount);

      const feeMakeXfer = amount.mul(feeMake).div(toWei(1));
      const feeTakeXfer = amount.mul(feeTake).div(toWei(1));
      let feeRebateXfer = 0;
      if (Number(level) === 1)
        feeRebateXfer = amount.mul(feeRebate).div(toWei(1));
      if (Number(level) === 2) feeRebateXfer = feeTakeXfer;

      expect(
        initialFeeBalance1.add(initialBalance11).add(initialBalance12)
      ).to.equal(feeBalance1.add(balance11).add(balance12));
      expect(
        initialFeeBalance2.add(initialBalance21).add(initialBalance22)
      ).to.equal(feeBalance2.add(balance21).add(balance22));
      expect(feeBalance1.sub(initialFeeBalance1)).to.equal(
        feeMakeXfer.add(feeTakeXfer).sub(feeRebateXfer)
      );
      expect(balance11).to.equal(
        initialBalance11.add(amount).sub(feeMakeXfer).add(feeRebateXfer)
      );
      expect(balance12).to.equal(initialBalance12.sub(amount.add(feeTakeXfer)));
      expect(balance21).to.equal(
        initialBalance21.sub(amount.mul(amountGive).div(amountGet))
      );
      expect(balance22).to.equal(
        initialBalance22.add(amount.mul(amountGive).div(amountGet))
      );
    }

    const trades = [
      {
        expires: 10,
        orderNonce: 1,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
        accountLevel: 0,
      },
      {
        expires: 10,
        orderNonce: 2,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
        accountLevel: 1,
      },
      {
        expires: 10,
        orderNonce: 3,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: BigNumber.from(50),
        amountGive: BigNumber.from(25),
        amount: BigNumber.from(25),
        accountLevel: 2,
      },
    ];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      await testTrade(
        trade.expires,
        trade.orderNonce,
        trade.tokenGet,
        trade.tokenGive,
        trade.amountGet,
        trade.amountGive,
        trade.amount,
        trade.accountLevel
      );
    }
  });
});
