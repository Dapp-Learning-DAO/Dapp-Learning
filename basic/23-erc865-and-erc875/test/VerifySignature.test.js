require('@nomiclabs/hardhat-waffle');
const { expect } = require('chai');
const fs = require('fs');
const { ethers } = require('hardhat');

const {
  encrypt,
  recoverPersonalSignature,
  recoverTypedSignatureLegacy,
  signTypedDataLegacy,
  recoverTypedSignature,
  recoverTypedSignature_v4,
} = require('eth-sig-util');

const { BigNumber, utils, provider } = ethers;
const {
  solidityPack,
  concat,
  toUtf8Bytes,
  keccak256,
  SigningKey,
  formatBytes32String,
} = utils;

describe('VerifySignature', () => {
  let contract;
  beforeEach(async () => {
    const VerifySignature = await ethers.getContractFactory('VerifySignature');
    contract = await VerifySignature.deploy();
    await contract.deployed();
  });

  it('should be deployed', async () => {
    expect(await contract.deployed()).to.equal(contract);
  });
  it('personal_sign_string', async () => {
    const [signer] = await ethers.getSigners();
    console.log('signer address = ', signer.address);
    const message = 'Example `personal_sign` message';
    const hashedMessage = utils.keccak256(utils.toUtf8Bytes(message));
    // const hashedMessage = `0x${Buffer.from(message, 'utf8').toString('hex')}`;
    console.log(`hashedMessage = `, hashedMessage);

    const signature = await provider.send('personal_sign', [
      hashedMessage,
      signer.address,
    ]);
    console.log(`signature = `, signature);

    const jsRecoveredAddr = recoverPersonalSignature({
      data: hashedMessage,
      sig: signature,
    });
    console.log('jsRecoveredAddr = ', jsRecoveredAddr);
    expect(await signer.address.toUpperCase()).to.equal(
      jsRecoveredAddr.toUpperCase()
    );

    const contractRecoveredResult = await contract.verify(message, signature);
    console.log('contractRecoveredResult = ', contractRecoveredResult);
    expect(await signer.address.toUpperCase()).to.equal(
      contractRecoveredResult.toUpperCase()
    );
  });

  it('personal_sign_data', async () => {
    const [signer] = await ethers.getSigners();
    console.log('signer address = ', signer.address);
    const types = ['bytes', 'bytes', 'address', 'string', 'string', 'uint256'];
    const values = [
      '0x19',
      '0x00',
      '0x8ef9f0acfef3d9ab023812bb889a8f5a214b9b82',
      '测试',
      '{}',
      1,
    ];
    const hashedMessage = utils.solidityKeccak256(types, values);
    console.log(`hashedMessage = `, hashedMessage);

    const signature = await provider.send('personal_sign', [
      hashedMessage,
      signer.address,
    ]);
    console.log(`signature = `, signature);

    const jsRecoveredAddr = recoverPersonalSignature({
      data: hashedMessage,
      sig: signature,
    });
    console.log('jsRecoveredAddr = ', jsRecoveredAddr);
    expect(await signer.address.toUpperCase()).to.equal(
      jsRecoveredAddr.toUpperCase()
    );

    const contractRecoveredResult = await contract.verify2(
      hashedMessage,
      signature
    );
    console.log('contractRecoveredResult = ', contractRecoveredResult);
    expect(await signer.address.toUpperCase()).to.equal(
      contractRecoveredResult.toUpperCase()
    );
  });

  it('struct_sign_typed_data_v1', async () => {
    const [signer] = await ethers.getSigners();

    // 这里我们的私钥，是通过`npx hardhat node`来得到的。
    signer.privateKey =
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    console.log('signer address = ', signer.address);
    const msgParams = [
      {
        type: 'string',
        name: 'Message',
        value: 'Hi, Alice!',
      },
      {
        type: 'uint32',
        name: 'Value',
        value: 1337,
      },
    ];
    const privateKey1Buffer = Buffer.from(signer.privateKey, 'hex');
    const signature = signTypedDataLegacy(privateKey1Buffer, {
      data: msgParams,
    });

    // 如果是metmask插件，可以调用下面的方法
    // const signature = await provider.send('eth_signTypedData', [msgParams, signer.address]);
    const jsRecoveredAddr = recoverTypedSignatureLegacy({
      data: msgParams,
      sig: signature,
    });
    console.log('jsRecoveredAddr = ', jsRecoveredAddr);
    expect(signer.address.toUpperCase()).to.equal(
      jsRecoveredAddr.toUpperCase()
    );
  });

  it('struct_sign_typed_data_v3', async () => {
    const [signer] = await ethers.getSigners();
    console.log('signer address = ', signer.address);
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    console.log('chainId = ', network.chainId);
    console.log(`contract address = `, contract.address);
    const msgParams = {
      types: {
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId,
        verifyingContract: contract.address,
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    };

    const signature = await signer._signTypedData(
      msgParams.domain,
      msgParams.types,
      msgParams.message
    );
    console.log(`signature = `, signature);
    // 如果是metmask插件，可以调用下面的方法
    // const signature = await provider.send('eth_signTypedData_v3', [signer.address, msgParams]);

    const jsRecoveredAddr = utils.verifyTypedData(
      msgParams.domain,
      msgParams.types,
      msgParams.message,
      signature
    );
    // const jsRecoveredAddr = recoverTypedSignature({
    //   data: msgParams,
    //   sig: signature,
    // });
    console.log('jsRecoveredAddr = ', jsRecoveredAddr);
    expect(signer.address.toUpperCase()).to.equal(
      jsRecoveredAddr.toUpperCase()
    );

    const contractRecoveredResult = await contract.verify3(
      msgParams.message,
      signature
    );
    console.log('contractRecoveredResult = ', contractRecoveredResult);
    expect(await signer.address.toUpperCase()).to.equal(
      contractRecoveredResult.toUpperCase()
    );
  });

  it('struct_sign_typed_data_v4', async () => {
    const [signer] = await ethers.getSigners();
    console.log('signer address = ', signer.address);
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    console.log('chainId = ', network.chainId);
    console.log(`contract address = `, contract.address);
    const msgParams = {
      domain: {
        version: '1',
        name: 'Ether Mail',
        chainId,
        verifyingContract: contract.address,
      },
      message: {
        // contents: 'Hello, Bob!',
        // from: {
        // name: 'Cow',
        // wallets: ['0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826', '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF'],
        // },
        // to: [
        //   {
        //     name: 'Bob',
        //     wallets: [
        //       '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        //       '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
        //       '0xB0B0b0b0b0b0B000000000000000000000000000',
        //     ],
        //   },
        // ],
        data: ['1', '2', '3'],
      },
      primaryType: 'Message',
      types: {
        // Mail: [
        //   { name: 'from', type: 'Person' },
        //   { name: 'to', type: 'Person[]' },
        //   { name: 'contents', type: 'string' },
        // ],
        // Person: [
        //   { name: 'name', type: 'string' },
        //   { name: 'wallets', type: 'address[]' },
        // ],
        Message: [{ name: 'data', type: 'string[]' }],
      },
    };

    const signature = await signer._signTypedData(
      msgParams.domain,
      msgParams.types,
      msgParams.message
    );
    console.log(`signature = `, signature);
    // 如果是metmask插件，可以调用下面的方法
    // const signature = await provider.send('eth_signTypedData_v4', [signer.address, msgParams]);

    const jsRecoveredAddr = utils.verifyTypedData(
      msgParams.domain,
      msgParams.types,
      msgParams.message,
      signature
    );

    console.log('jsRecoveredAddr = ', jsRecoveredAddr);
    expect(signer.address.toUpperCase()).to.equal(
      jsRecoveredAddr.toUpperCase()
    );

    const contractRecoveredResult = await contract.verify4(
      msgParams.message,
      signature
    );
    console.log('contractRecoveredResult = ', contractRecoveredResult);
    expect(await signer.address.toUpperCase()).to.equal(
      contractRecoveredResult.toUpperCase()
    );
  });
});
