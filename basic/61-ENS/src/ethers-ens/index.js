var ethers = require('ethers');

var provider = ethers.getDefaultProvider('ropsten');

const ensName = 'registrar.firefly.eth';
const address = '0x6fC21092DA55B392b045eD78F4732bff3C580e2c';

(async () => {
    // 解析至以太坊地址
    const ethAddress = await provider.resolveName(ensName);
    console.log(`${ensName}对应的以太坊地址: ${ethAddress}`);

    // 反向解析
    const name = await provider.lookupAddress(address);
    console.log(`${address}对应的ens名称: ${name}`);

    // ethers支持在任何需要使用地址的地方也可以使用ENS域名，一般不需要直接调用resolveName
    const balance = await provider.getBalance(ensName);
    console.log('balance: ', ethers.utils.formatEther(balance));
})()