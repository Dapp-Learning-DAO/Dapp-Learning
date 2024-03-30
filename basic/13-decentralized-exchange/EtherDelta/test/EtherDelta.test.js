const { expect } = require('chai');
const hre = require('hardhat');
const ethers = hre.ethers;
const fs = require('fs');
const testAccounts = JSON.parse(fs.readFileSync('./testAccounts.json'));

const {
  solidityPacked,
  concat,
  toUtf8Bytes,
  keccak256,
  SigningKey,
  encodeBytes32String,
} = ethers;

const toWei = (value) => ethers.parseEther(value.toString());
const fromWei = (value) =>
  ethers.formatEther(typeof value === 'string' ? value : value.toString());

const getBalance = ethers.provider.getBalance;

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

describe('EtherDelta', () => {
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
    // token1
    token1 = await ethers.deployContract('ReserveToken');

    // token2
    token2 = await ethers.deployContract('ReserveToken');

    // AccountLevelsTest
    accountLevelsTest = await ethers.deployContract('AccountLevelsTest');
    const accountLevelsTestAddress = await accountLevelsTest.getAddress();

    etherDelta = await ethers.deployContract('EtherDelta', [admin, feeAccount, accountLevelsTestAddress, feeMake, feeTake, feeRebate]);
    // [admin, feeAccount, contractAccountLevelsAddr, feeMake, feeTake, feeRebate]
  });

  it('Should mint some tokens', async () => {
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

  it('Should add funds to etherdelta', async () => {
    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();
    const etherDeltaAddress = await etherDelta.getAddress();
    const amount = toWei(1000);

    // 并行处理多个异步操作
    await Promise.all([
      // deposit eth
      etherDelta.connect(user1).deposit({ value: amount }),
      // deposit token1
      token1.create(user1.address, amount)
        .then(() => token1.connect(user1).approve(etherDeltaAddress, amount))
        .then(() => etherDelta.connect(user1).depositToken(token1Address, amount)),
      // deposit token2
      token2.create(user1.address, amount)
        .then(() => token2.connect(user1).approve(etherDeltaAddress, amount))
        .then(() => etherDelta.connect(user1).depositToken(token2Address, amount)),
    ]);

    // 验证余额
    expect(await etherDelta.balanceOf(ADDRESS_ZERO, user1.address)).to.equal(amount);
    expect(await etherDelta.balanceOf(token1Address, user1.address)).to.equal(amount);
    expect(await etherDelta.balanceOf(token2Address, user1.address)).to.equal(amount);
  });


  // 交易前为账户准备token并向交易所授权，存入
  async function prepareTokens() {

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();
    const etherDeltaAddress = await etherDelta.getAddress();

    const _tokenAmountInit = toWei(100000);

    await etherDelta.connect(user1).deposit({ value: toWei(100) });
    await etherDelta.connect(user2).deposit({ value: toWei(100) });

    await token1.create(user1.address, _tokenAmountInit);
    await token1.connect(user1).approve(etherDeltaAddress, _tokenAmountInit);
    await etherDelta
      .connect(user1)
      .depositToken(token1Address, _tokenAmountInit);
    await token2.create(user1.address, _tokenAmountInit);
    await token2.connect(user1).approve(etherDeltaAddress, _tokenAmountInit);
    await etherDelta
      .connect(user1)
      .depositToken(token2Address, _tokenAmountInit);
    await token1.create(user2.address, _tokenAmountInit);
    await token1.connect(user2).approve(etherDeltaAddress, _tokenAmountInit);
    await etherDelta
      .connect(user2)
      .depositToken(token1Address, _tokenAmountInit);
    await token2.create(user2.address, _tokenAmountInit);
    await token2.connect(user2).approve(etherDeltaAddress, _tokenAmountInit);
    await etherDelta
      .connect(user2)
      .depositToken(token2Address, _tokenAmountInit);
  }

  // 查询各个账户余额情况
  async function checkUsersBlance() {
    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const feeBalance1 = await etherDelta.balanceOf(token1Address, feeAccount);
    const feeBalance2 = await etherDelta.balanceOf(token2Address, feeAccount);

    const balance11 = await etherDelta.balanceOf(token1Address, user1.address);
    const balance12 = await etherDelta.balanceOf(token1Address, user2.address);

    const balance21 = await etherDelta.balanceOf(token2Address, user1.address);
    const balance22 = await etherDelta.balanceOf(token2Address, user2.address);

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
    user,
  ) {
    const etherDeltaAddress = await etherDelta.getAddress();
    let hash = keccak256(
      solidityPacked(
        [
          'address',
          'address',
          'uint256',
          'address',
          'uint256',
          'uint256',
          'uint256',
        ],
        [
          etherDeltaAddress,
          tokenGet,
          amountGet,
          tokenGive,
          amountGive,
          expires,
          orderNonce,
        ],
      ),
    );

    // console.log('hash', hash.length, hash)
    const messagePrefix = '\x19Ethereum Signed Message:\n';
    hash = keccak256(
      concat([toUtf8Bytes(messagePrefix), toUtf8Bytes(String(32)), hash]),
    );

    const signingKey = new SigningKey(user.privateKey);
    const signature = signingKey.sign(hash);
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

  it('Should do some trades initiated offchain', async () => {
    await prepareTokens();
    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    async function testTradeOffChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
      accountLevel,
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
        user1,
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
      expect(availableVolume).to.equal(amountGet - amount);

      const amountFilled = await etherDelta.amountFilled(orderSigned);
      expect(amountFilled).to.equal(amount);

      const feeMakeXfer = amount * feeMake / toWei(1);
      const feeTakeXfer = amount * feeTake / (toWei(1));
      let feeRebateXfer = 0n;
      if (Number(level) === 1)
        feeRebateXfer = amount * feeRebate / toWei(1);
      if (Number(level) === 2) feeRebateXfer = feeTakeXfer;

      expect(
        initialFeeBalance1 + (initialBalance11) + (initialBalance12),
      ).to.equal(feeBalance1 + (balance11) + (balance12));
      expect(
        initialFeeBalance2 + (initialBalance21) + (initialBalance22),
      ).to.equal(feeBalance2 + (balance21) + (balance22));
      expect(feeBalance1 - (initialFeeBalance1)).to.equal(
        feeMakeXfer + (feeTakeXfer) - (feeRebateXfer),
      );
      expect(balance11).to.equal(
        initialBalance11 + (amount) - (feeMakeXfer) + (feeRebateXfer),
      );
      expect(balance12).to.equal(initialBalance12 - (amount + (feeTakeXfer)));
      expect(balance21).to.equal(
        initialBalance21 - (amount * (amountGive) / (amountGet)),
      );
      expect(balance22).to.equal(
        initialBalance22 + (amount * (amountGive) / (amountGet)),
      );
    }

    const trades = [
      {
        expires: 10,
        orderNonce: 1,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
        accountLevel: 0,
      },
      {
        expires: 10,
        orderNonce: 2,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
        accountLevel: 1,
      },
      {
        expires: 10,
        orderNonce: 3,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: BigInt(50),
        amountGive: BigInt(25),
        amount: BigInt(25),
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
        trade.accountLevel,
      );
    }
  });

  it('Should do some trades initiated onchain', async () => {
    await prepareTokens();
    const etherDeltaAddress = await etherDelta.getAddress();

    async function testTradeOnChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
      accountLevel,
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
        r: encodeBytes32String('0'),
        s: encodeBytes32String('0'),
      };
      // await etherDelta
      //   .connect(user1)
      //   .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce)

      await etherDelta.connect(user1).order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);
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
      expect(availableVolume).to.equal(amountGet - (amount));

      const amountFilled = await etherDelta.amountFilled(orderNotSigned);
      expect(amountFilled).to.equal(amount);

      const feeMakeXfer = amount * (feeMake) / (toWei(1));
      const feeTakeXfer = amount * (feeTake) / (toWei(1));
      let feeRebateXfer = 0n;
      if (Number(level) === 1)
        feeRebateXfer = amount * (feeRebate) / (toWei(1));
      if (Number(level) === 2) feeRebateXfer = feeTakeXfer;

      expect(
        initialFeeBalance1 + (initialBalance11) + (initialBalance12),
      ).to.equal(feeBalance1 + (balance11) + (balance12));
      expect(
        initialFeeBalance2 + (initialBalance21) + (initialBalance22),
      ).to.equal(feeBalance2 + (balance21) + (balance22));
      expect(feeBalance1 - (initialFeeBalance1)).to.equal(
        feeMakeXfer + (feeTakeXfer) - (feeRebateXfer),
      );
      expect(balance11).to.equal(
        initialBalance11 + (amount) - (feeMakeXfer) + (feeRebateXfer),
      );
      expect(balance12).to.equal(initialBalance12 - (amount + (feeTakeXfer)));
      expect(balance21).to.equal(
        initialBalance21 - (amount * (amountGive) / (amountGet)),
      );
      expect(balance22).to.equal(
        initialBalance22 + (amount * (amountGive) / (amountGet)),
      );
    }

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const trades = [
      {
        expires: 10,
        orderNonce: 1,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
        accountLevel: 0,
      },
      {
        expires: 10,
        orderNonce: 2,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
        accountLevel: 1,
      },
      {
        expires: 10,
        orderNonce: 3,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: BigInt(50),
        amountGive: BigInt(25),
        amount: BigInt(25),
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
        trade.accountLevel,
      );
    }
  });

  it('Should place an order offchain, check availableVolume and amountFilled, then cancel', async () => {
    await prepareTokens();

    async function testCancelOffChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
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
        user1,
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

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const trades = [
      {
        expires: 10,
        orderNonce: 7,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
      },
      {
        expires: 10,
        orderNonce: 8,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: BigInt(50),
        amountGive: BigInt(25),
        amount: BigInt(25),
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
        trade.amount,
      );
    }
  });

  it('Should place an order onchain, check availableVolume and amountFilled, then cancel', async () => {
    await prepareTokens();

    async function testCancelOnChain(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
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
        r: encodeBytes32String('0'),
        s: encodeBytes32String('0'),
      };

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

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const trades = [
      {
        expires: 10,
        orderNonce: 7,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(25),
      },
      {
        expires: 10,
        orderNonce: 8,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: BigInt(50),
        amountGive: BigInt(25),
        amount: BigInt(25),
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
        trade.amount,
      );
    }
  });

  it('Should do a trade and check available volume depletion', async () => {
    await prepareTokens();

    async function testDepletion(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
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
        user1,
      );

      await etherDelta
        .connect(user1)
        .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);

      await etherDelta.connect(user2).trade(orderSigned, amount);

      const availableVolume = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume).to.equal(amountGet - (amount));
    }

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const trades = [
      {
        expires: 1000,
        orderNonce: 11,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(50) / (2n),
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
        trade.accountLevel,
      );
    }
  });

  it('Should do a self trade and check available volume depletion', async () => {
    await prepareTokens();

    async function testSelfDepletion(
      expiresIn,
      orderNonce,
      tokenGet,
      tokenGive,
      amountGet,
      amountGive,
      amount,
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
        user1,
      );

      await etherDelta
        .connect(user1)
        .order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);

      await etherDelta.connect(user1).trade(orderSigned, amount);

      const availableVolume = await etherDelta.availableVolume(orderSigned);
      expect(availableVolume).to.equal(amountGet - (amount));
    }

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const trades = [
      {
        expires: 1000,
        orderNonce: 11,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(50) / (2n),
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
        trade.accountLevel,
      );
    }
  });

  it('Should attempt some trades initiated onchain that should fail', async () => {
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
      amount,
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
        r: encodeBytes32String('0'),
        s: encodeBytes32String('0'),
      };

      await etherDelta.connect(user1).order(tokenGet, amountGet, tokenGive, amountGive, expires, orderNonce);
      await expect(etherDelta.connect(user2).trade(orderNotSigned, amount)).to.be.reverted;

    }

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const trades = [
      {
        expires: 10,
        orderNonce: 1,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: toWei(25),
        amount: toWei(51),
      },
      {
        expires: 10,
        orderNonce: 2,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: toWei(50),
        amountGive: initialBalance21 + 1n,
        amount: toWei(25),
      },
      {
        expires: 10,
        orderNonce: 3,
        tokenGet: token1Address,
        tokenGive: token2Address,
        amountGet: initialBalance12,
        amountGive: BigInt(25),
        amount: initialBalance12 + 1n,
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

  it('Should do a token withdrawal', async () => {
    await prepareTokens();

    const token1Address = await token1.getAddress();
    const token2Address = await token2.getAddress();

    const amount = toWei(100);

    const initialBalance = await etherDelta.balanceOf(
      token1Address,
      user1.address,
    );
    const initialTokenBalance = await token1.balanceOf(user1.address);

    await etherDelta.connect(user1).withdrawToken(token1Address, amount);

    const finalBalance = await etherDelta.balanceOf(
      token1Address,
      user1.address,
    );
    const finalTokenBalance = await token1.balanceOf(user1.address);

    expect(finalBalance).to.equal(initialBalance - (amount));
    expect(finalTokenBalance).to.equal(initialTokenBalance + (amount));
  });

  it('Should do a Ether withdrawal', async () => {
    await prepareTokens();

    const amount = toWei(10);

    const initialBalance = await etherDelta.balanceOf(
      ADDRESS_ZERO,
      user1.address,
    );
    //const initialEthBalance = await getBalance(user1.address);
    const initialEthBalance = await ethers.provider.getBalance(user1.address);
    // 预估gas 费用
    const gas = await etherDelta.connect(user1).withdraw.estimateGas(amount);
    const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
    const gasFee = gas * (gasPrice);
    await etherDelta.connect(user1).withdraw(amount);

    const finalBalance = await etherDelta.balanceOf(
      ADDRESS_ZERO,
      user1.address,
    );
    const finalEthBalance = await ethers.provider.getBalance(user1.address);

    expect(finalBalance).to.equal(initialBalance - (amount));
    expect(finalEthBalance + (gasFee)).to.equal(initialEthBalance + (amount));
  });

  describe('tests need prepareTokens', () => {

    beforeEach(async () => {
      await prepareTokens();
    });

    it('Should change the account levels address and fail', async () => {
      await expect(etherDelta.connect(user1).changeAccountLevelsAddr(ADDRESS_ZERO)).to.be.revertedWith('No permission');
    });

    it('Should change the account levels address and success', async () => {
      await etherDelta.connect(owner).changeAccountLevelsAddr(ADDRESS_ZERO);
      expect(await etherDelta.accountLevelsAddr()).to.equal(ADDRESS_ZERO);

    });

    it('Should change the fee account and fail', async () => {
      await expect(etherDelta.connect(user1).changeFeeAccount(ADDRESS_ZERO)).to.be.revertedWith('No permission');
    });

    it('Should change the fee account and succeed', async () => {
      await etherDelta.connect(owner).changeFeeAccount(user1.address);
      expect(await etherDelta.feeAccount()).to.equal(user1.address);
    });

    it('Should change the make fee and fail', async () => {
      await expect(etherDelta.connect(user1).changeFeeMake(feeMake)).to.be.revertedWith('No permission');
    });

    it('Should change the make fee and fail because the make fee can only decrease', async () => {
      await expect(etherDelta.connect(owner).changeFeeMake(feeMake * (2n))).to.be.reverted;
    });

    it('Should change the make fee and succeed', async () => {
      await etherDelta.connect(owner).changeFeeMake(feeMake / (2n));
      expect(await etherDelta.feeMake()).to.equal(feeMake / (2n));
    });

    it('Should change the take fee and fail', async () => {
      await expect(etherDelta.connect(user1).changeFeeTake(feeTake)).to.be.revertedWith('No permission');
    });

    it('Should change the take fee and fail because the take fee can only decrease', async () => {
      await expect(etherDelta.connect(owner).changeFeeTake(feeTake * (2n))).to.be.reverted;
    });

    it('Should change the take fee and fail because the take fee must exceed the rebate fee', async () => {
      await expect(etherDelta.connect(owner).changeFeeTake(feeRebate - (BigInt(1)))).to.be.reverted;
    });

    it('Should change the take fee and succeed', async () => {
      await etherDelta.connect(owner).changeFeeTake(feeRebate + (BigInt(2)));
      expect(await etherDelta.feeTake()).to.be.equal(feeRebate + (BigInt(2)));
    });

    it('Should change the rebate fee and fail', async () => {
      await expect(etherDelta.connect(user1).changeFeeRebate(feeRebate)).to.be.revertedWith('No permission');
    });

    it('Should change the rebate fee and fail because the rebate fee can only increase', async () => {
      await expect(etherDelta.connect(owner).changeFeeRebate(feeRebate / (2n))).to.be.reverted;
    });

    it('Should change the rebate fee and fail because the rebate fee must not exceed the take fee', async () => {
      await expect(etherDelta.connect(owner).changeFeeRebate(feeTake + (BigInt(1)))).to.be.reverted;
    });

    it('Should change the rebate fee and succeed', async () => {
      await etherDelta.connect(owner).changeFeeRebate(feeTake - (BigInt(1)));
      expect(await etherDelta.feeRebate()).to.be.equal(feeTake - (BigInt(1)));
    });

    it('Should change the admin account and fail', async () => {
      await expect(etherDelta.connect(user1).changeAdmin(user1.address)).to.be.revertedWith('No permission');
    });

    it('Should change the admin account and succeed', async () => {
      await etherDelta.connect(owner).changeAdmin(user1.address);
      expect(await etherDelta.admin()).to.be.equal(user1.address);
    });

  });

});
