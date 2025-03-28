const {ethers} = require("hardhat");
const bip39 = require('bip39');

//  通过助记词创建钱包
//squirrel refuse ozone miracle hollow renew sail clever fruit chaos merit brown
//const mnemonic = "squirrel mirror fruit merit chaos sail hollow ozone clever brown renew refuse";
const mnemonic = "squirrel refuse ozone miracle hollow renew  sail clever fruit chaos merit brown";

function* permutations(arr, n = arr.length) {
    if (n <= 1) yield arr.slice();
    else for (let i = 0; i < n; i++) {
        yield* permutations(arr, n - 1);
        const j = n % 2 ? 0 : i;
        [arr[n - 1], arr[j]] = [arr[j], arr[n - 1]];
    }
}

const words = mnemonic.split(' ');

for (const perm of permutations(words)) {
    const testMnemonic = perm.join(' ');
    console.log(testMnemonic);
    if (bip39.validateMnemonic(testMnemonic)) {
    
       
        for (let i = 0; i <= 10; i++) {
            let path = `m/44'/60'/1'/0/${i}`;
            let secondMnemonicWallet = ethers.Wallet.fromMnemonic(testMnemonic, path);
            if (secondMnemonicWallet.address.toLowerCase() === "0x55A68930b14f8166AD0c432C01d68739B94d3cf3".toLowerCase()) {
                console.log(`Valid mnemonic: ${testMnemonic} with path: ${path}`);
                break;
            }
        }
  
    }
   
}

// if (validMnemonics.length > 0) {
//     console.log("Valid mnemonic orders found:");
//     validMnemonics.forEach(mnemonic => console.log(mnemonic));
// } else {
//     console.error("No valid mnemonic order found.");
// }

// const wallet2 = ethers.Wallet.fromMnemonic(validMnemonics[0] ? validMnemonics[0] : mnemonic);
// console.log("Address: " + wallet2.address);

// // Load the second account from a mnemonic
// let path = "m/44'/60'/1'/0/0";
// let secondMnemonicWallet = ethers.Wallet.fromMnemonic(validMnemonics[0] ? validMnemonics[0] : mnemonic, path);
// // Load using a non-english locale wordlist (the path "null" will use the default)
// // let secondMnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic, null, ethers.wordlists.ko);
