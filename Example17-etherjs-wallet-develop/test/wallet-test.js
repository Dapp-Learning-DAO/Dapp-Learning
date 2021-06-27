const { expect } = require("chai");

describe("Token contract", function() {
  it("create wallet", async function() {
   
    //创建随机地址的钱包
    const wallet = ethers.Wallet.createRandom();
    console.log("Address: " + wallet.address);
    console.log('导出私钥：' + wallet.privateKey);
  
    //通过明文私钥创建钱包
    const privateKey = "0x0123456789012345678901234567890123456789012345678901234567890123";
    const wallet1 = new ethers.Wallet(privateKey);
    console.log("Address: " + wallet1.address);
  
   //  通过助记词创建钱包
    const mnemonic = "radar blur cabbage chef fix engine embark joy scheme fiction master release";
    const wallet2 = ethers.Wallet.fromMnemonic(mnemonic);
    console.log("Address: " + wallet2.address);
    // Load the second account from a mnemonic
    let path = "m/44'/60'/1'/0/0";
    let secondMnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    // Load using a non-english locale wordlist (the path "null" will use the default)
   // let secondMnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic, null, ethers.wordlists.ko);
  
    const entropy = ethers.utils.randomBytes(16);
    const mnemonicTemp = ethers.utils.entropyToMnemonic(entropy);
// 生成了 12 个随机单词，mnemonicTemp 为 "radar blur cabbage chef fix engine embark joy scheme fiction master release";
    const wallet3 = ethers.Wallet.fromMnemonic(mnemonicTemp);
    console.log('导出助记词：' + wallet3.mnemonic);
    
    //通过 keystore 创建钱包
    // 钱包对象又一个encrypt方法可以导出钱包的keystore
    let data = {
      id: "fb1280c0-d646-4e40-9550-7026b1be504a",
      address: "88a5c2d9919e46f883eb62f7b8dd9d0cc45bc290",
      Crypto: {
        kdfparams: {
          dklen: 32,
          p: 1,
          salt: "bbfa53547e3e3bfcc9786a2cbef8504a5031d82734ecef02153e29daeed658fd",
          r: 8,
          n: 262144
        },
        kdf: "scrypt",
        ciphertext: "10adcc8bcaf49474c6710460e0dc974331f71ee4c7baa7314b4a23d25fd6c406",
        mac: "1cf53b5ae8d75f8c037b453e7c3c61b010225d916768a6b145adf5cf9cb3a703",
        cipher: "aes-128-ctr",
        cipherparams: {
          iv: "1dcdf13e49cea706994ed38804f6d171"
        }
      },
      "version" : 3
    };
    const json = JSON.stringify(data);
    const password = "foo";
    ethers.Wallet.fromEncryptedJson(json, password).then(function(wallet) {
      console.log("Address: " + wallet.address);
    });
    function callback(percent) {
      console.log("Encrypting: " + parseInt(percent * 100) + "% complete");
    }
    const keystore = await wallet.encrypt(password, callback);
    console.log('导出 keystore：' + keystore);
    
    // 创建脑记忆钱包 v0.4 dangerous so delete
    // const username = "support@ethers.io";
    // const password1 = "password123";
    // ethers.Wallet.fromBrainWallet(username, password1).then(function(wallet) {
    //   console.log("Address: " + wallet.address);
    //   // "Address: 0x7Ee9AE2a2eAF3F0df8D323d555479be562ac4905"
    // });
    
    
  });

  it("big number ", async function() {
    const wei =ethers.BigNumber.from("1000000000000000000000");
  
    console.log(ethers.utils.formatEther(wei));
// "1000.0"
  
    console.log(ethers.utils.formatEther(wei, {commify: true}));
// "1,000.0"
  
    console.log(ethers.utils.formatEther(wei, {pad: true}));
// "1000.000000000000000000"
  
    console.log(ethers.utils.formatEther(wei, {commify: true, pad: true}));
  });
});
