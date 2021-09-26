require("@nomiclabs/hardhat-waffle");
const { expect } = require("chai");

const fs = require("fs");
const testAccounts = JSON.parse(fs.readFileSync("./testAccounts.json"));

const { BigNumber, utils, provider } = ethers;
const {
  solidityPack,
  concat,
  toUtf8Bytes,
  keccak256,
  SigningKey,
  formatBytes32String
} = utils;

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
    // 加载privateKey
    owner.privateKey = testAccounts[0];
    user1.privateKey = testAccounts[1];
    user2.privateKey = testAccounts[2];

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

  // 交易前为账户准备token并向交易所授权，存入
  async function prepareTokens() {
    const _tokenAmountInit = toWei(100000);

    await etherDelta.connect(user1).deposit({ value: toWei(100) });
    await etherDelta.connect(user2).deposit({ value: toWei(100) });

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

  // 查询各个账户余额情况
  async function checkUsersBlance() {
    const feeBalance1 = await etherDelta.balanceOf(token1.address, feeAccount);
    const feeBalance2 = await etherDelta.balanceOf(token2.address, feeAccount);

    const balance11 = await etherDelta.balanceOf(token1.address, user1.address);
    const balance12 = await etherDelta.balanceOf(token1.address, user2.address);

    const balance21 = await etherDelta.balanceOf(token2.address, user1.address);
    const balance22 = await etherDelta.balanceOf(token2.address, user2.address);

    return [
      feeBalance1,
      feeBalance2,
      balance11,
      balance12,
      balance21,
      balance22,
    ];
  }

  // 签名获得 v, r, s
  async function signOrder(
    tokenGet,
    amountGet,
    tokenGive,
    amountGive,
    expires,
    orderNonce,
    user
  ) {
    let hash = keccak256(
      solidityPack(
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
      )
    );

    // console.log('hash', hash.length, hash)
    const messagePrefix = "\x19Ethereum Signed Message:\n";
    hash = keccak256(
      concat([toUtf8Bytes(messagePrefix), toUtf8Bytes(String(32)), hash])
    );

    const signingKey = new SigningKey(user.privateKey);
    const signature = signingKey.signDigest(hash);
    const { v, r, s } = signature;

    return {
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      expires,
      nonce: orderNonce,
      user: user.address,
      v,
      r,
      s,
    };
  }

  it("Should do some trades initiated offchain", async () => {
    await prepareTokens();

    async function testTradeOffChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
      accountLevel
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      const orderSigned = await signOrder(
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        orderNonce,
        user1
      );

      await accountLevelsTest.setAccountLevel(user1.address, accountLevel);
      const level = await accountLevelsTest.accountLevel(user1.address);

      const [
        initialFeeBalance1,
        initialFeeBalance2,
        initialBalance11,
        initialBalance12,
        initialBalance21,
        initialBalance22,
      ] = await checkUsersBlance();

      // await etherDelta
      //   .connect(user1)
      //   .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce)

      await etherDelta.connect(user2).trade(orderSigned, amount);

      const [
        feeBalance1,
        feeBalance2,
        balance11,
        balance12,
        balance21,
        balance22,
      ] = await checkUsersBlance();

      const availableVolume = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume).to.equal(amountGet.sub(amount));

      const amountFilled = await etherDelta.amountFilled(orderSigned);
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
      await testTradeOffChain(
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

  it("Should do some trades initiated onchain", async () => {
    await prepareTokens();

    async function testTradeOnChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
      accountLevel
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      await accountLevelsTest.setAccountLevel(user1.address, accountLevel);
      const level = await accountLevelsTest.accountLevel(user1.address);

      const [
        initialFeeBalance1,
        initialFeeBalance2,
        initialBalance11,
        initialBalance12,
        initialBalance21,
        initialBalance22,
      ] = await checkUsersBlance();

      const orderNotSigned = {
        tokenGet: tokenGet,
        amountGet: amountGet,
        tokenGive: tokenGive,
        amountGive: amountGive,
        expires: expires,
        nonce: orderNonce,
        user: user1.address,
        v: 0,
        r: formatBytes32String(0),
        s: formatBytes32String(0)
      }
      // await etherDelta
      //   .connect(user1)
      //   .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce)

      await etherDelta.connect(user1).order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce)
      await etherDelta.connect(user2).trade(orderNotSigned, amount);

      const [
        feeBalance1,
        feeBalance2,
        balance11,
        balance12,
        balance21,
        balance22,
      ] = await checkUsersBlance();

      const availableVolume = await etherDelta.availableVolume(orderNotSigned);
      expect(availableVolume).to.equal(amountGet.sub(amount));

      const amountFilled = await etherDelta.amountFilled(orderNotSigned);
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
      await testTradeOnChain(
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

  it("Should place an order offchain, check availableVolume and amountFilled, then cancel", async () => {
    await prepareTokens();

    async function testCancelOffChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      // await etherDelta
      //   .connect(user1)
      //   .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);

      const orderSigned = await signOrder(
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        orderNonce,
        user1
      );

      const availableVolume1 = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume1).to.equal(amountGet);

      const amountFilled1 = await etherDelta.amountFilled(orderSigned);
      expect(amountFilled1).to.equal(toWei(0));

      await etherDelta.connect(user1).cancelOrder(orderSigned);

      const availableVolume2 = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume2).to.equal(toWei(0));

      const amountFilled2 = await etherDelta.amountFilled(orderSigned);
      expect(amountFilled2).to.equal(amountGet);
    }

    const trades = [
      {
        expires: 10,
        orderNonce: 7,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
      },
      {
        expires: 10,
        orderNonce: 8,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: BigNumber.from(50),
        amountGive: BigNumber.from(25),
        amount: BigNumber.from(25),
      },
    ];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      await testCancelOffChain(
        trade.expires,
        trade.orderNonce,
        trade.tokenGet,
        trade.tokenGive,
        trade.amountGet,
        trade.amountGive,
        trade.amount
      );
    }
  });

  it("Should place an order onchain, check availableVolume and amountFilled, then cancel", async () => {
    await prepareTokens();

    async function testCancelOnChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      await etherDelta
        .connect(user1)
        .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);

      const orderNotSigned = {
        tokenGet: tokenGet,
        amountGet: amountGet,
        tokenGive: tokenGive,
        amountGive: amountGive,
        expires: expires,
        nonce: orderNonce,
        user: user1.address,
        v: 0,
        r: formatBytes32String(0),
        s: formatBytes32String(0)
      }

      const availableVolume1 = await etherDelta.availableVolume(orderNotSigned);
      expect(availableVolume1).to.equal(amountGet);

      const amountFilled1 = await etherDelta.amountFilled(orderNotSigned);
      expect(amountFilled1).to.equal(toWei(0));

      await etherDelta.connect(user1).cancelOrder(orderNotSigned);

      const availableVolume2 = await etherDelta.availableVolume(orderNotSigned);
      expect(availableVolume2).to.equal(toWei(0));

      const amountFilled2 = await etherDelta.amountFilled(orderNotSigned);
      expect(amountFilled2).to.equal(amountGet);
    }

    const trades = [
      {
        expires: 10,
        orderNonce: 7,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
      },
      {
        expires: 10,
        orderNonce: 8,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: BigNumber.from(50),
        amountGive: BigNumber.from(25),
        amount: BigNumber.from(25),
      },
    ];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      await testCancelOnChain(
        trade.expires,
        trade.orderNonce,
        trade.tokenGet,
        trade.tokenGive,
        trade.amountGet,
        trade.amountGive,
        trade.amount
      );
    }
  });

  it("Should do a trade and check available volume depletion", async () => {
    await prepareTokens();

    async function testDepletion(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      const orderSigned = await signOrder(
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        orderNonce,
        user1
      );

      await etherDelta
        .connect(user1)
        .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);

      await etherDelta.connect(user2).trade(orderSigned, amount);

      const availableVolume = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume).to.equal(amountGet.sub(amount));
    }

    const trades = [
      {
        expires: 1000,
        orderNonce: 11,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(50).div(2),
        accountLevel: 0,
      },
    ];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      await testDepletion(
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

  it("Should do a self trade and check available volume depletion", async () => {
    await prepareTokens();

    async function testSelfDepletion(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      const orderSigned = await signOrder(
        tokenGet,
        amountGet,
        tokenGive,
        amountGive,
        expires,
        orderNonce,
        user1
      );

      await etherDelta
        .connect(user1)
        .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);

      await etherDelta.connect(user1).trade(orderSigned, amount);

      const availableVolume = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume).to.equal(amountGet.sub(amount));
    }

    const trades = [
      {
        expires: 1000,
        orderNonce: 11,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(50).div(2),
        accountLevel: 0,
      },
    ];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      await testSelfDepletion(
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

  it("Should attempt some trades initiated onchain that should fail", async () => {
    await prepareTokens();

    const [
      initialFeeBalance1,
      initialFeeBalance2,
      initialBalance11,
      initialBalance12,
      initialBalance21,
      initialBalance22,
    ] = await checkUsersBlance();

    async function testTradeFail(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount
    ) {
      let expires = await ethers.provider.getBlockNumber();
      expires += expiresIn;

      const orderNotSigned = {
        tokenGet: tokenGet,
        amountGet: amountGet,
        tokenGive: tokenGive,
        amountGive: amountGive,
        expires: expires,
        nonce: orderNonce,
        user: user1.address,
        v: 0,
        r: formatBytes32String(0),
        s: formatBytes32String(0)
      }

      await etherDelta.connect(user1).order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);
      await expect(etherDelta.connect(user2).trade(orderNotSigned, amount)).to.be.reverted;

    }

    const trades = [
      {
        expires: 10,
        orderNonce: 1,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(51)
      },
      {
        expires: 10,
        orderNonce: 2,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: toWei(50),
        amountGive: initialBalance21 + 1,
        amount: toWei(25)
      },
      {
        expires: 10,
        orderNonce: 3,
        tokenGet: token1.address,
        tokenGive: token2.address,
        amountGet: initialBalance12,
        amountGive: BigNumber.from(25),
        amount: initialBalance12 + 1
      },
    ];

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      await testTradeFail(
        trade.expires,
        trade.orderNonce,
        trade.tokenGet,
        trade.tokenGive,
        trade.amountGet,
        trade.amountGive,
        trade.amount,
        trade.accountLevel,
      );
    }
  });

  it("Should do a token withdrawal", async () => {
    await prepareTokens();

    const amount = toWei(100);

    const initialBalance = await etherDelta.balanceOf(
      token1.address,
      user1.address
    );
    const initialTokenBalance = await token1.balanceOf(user1.address);

    await etherDelta.connect(user1).withdrawToken(token1.address, amount);

    const finalBalance = await etherDelta.balanceOf(
      token1.address,
      user1.address
    );
    const finalTokenBalance = await token1.balanceOf(user1.address);

    expect(finalBalance).to.equal(initialBalance.sub(amount));
    expect(finalTokenBalance).to.equal(initialTokenBalance.add(amount));
  });

  it("Should do a Ether withdrawal", async () => {
    await prepareTokens();

    const amount = toWei(10);

    const initialBalance = await etherDelta.balanceOf(
      ADDRESS_ZERO,
      user1.address
    );
    const initialEthBalance = await getBalance(user1.address);

    // 预估gas 费用
    const gas = await etherDelta.connect(user1).estimateGas.withdraw(amount);
    const gasPrice = await provider.getGasPrice();
    const gasFee = gas.mul(gasPrice);

    await etherDelta.connect(user1).withdraw(amount);

    const finalBalance = await etherDelta.balanceOf(
      ADDRESS_ZERO,
      user1.address
    );
    const finalEthBalance = await getBalance(user1.address);

    expect(finalBalance).to.equal(initialBalance.sub(amount));
    expect(finalEthBalance.add(gasFee)).to.equal(initialEthBalance.add(amount));
  });

  it("Should change the account levels address and fail", async () => {
    await prepareTokens();

    await expect(etherDelta.connect(user1).changeAccountLevelsAddr(ADDRESS_ZERO)).to.be.revertedWith("No permission");

  });

  it("Should change the account levels address and success", async () => {
    await prepareTokens();

    await etherDelta.connect(owner).changeAccountLevelsAddr(ADDRESS_ZERO);
    expect(await etherDelta.accountLevelsAddr()).to.equal(ADDRESS_ZERO);

  });

});
