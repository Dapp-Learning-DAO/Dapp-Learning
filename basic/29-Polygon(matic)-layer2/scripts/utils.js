const bn = require("bn.js");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const Network = require("@maticnetwork/meta/network");
const Matic = require("@maticnetwork/maticjs").default;

const SCALING_FACTOR = new bn(10).pow(new bn(18));

async function getMaticClient(_network = "testnet", _version = "mumbai") {
	const network = new Network(_network, _version);
	const { from } = getAccount();
	const matic = new Matic({
		network: _network,
		version: _version,
		parentProvider: new HDWalletProvider(
			process.env.PRIVATE_KEY,
			network.Main.RPC
		),
		maticProvider: new HDWalletProvider(
			process.env.PRIVATE_KEY,
			network.Matic.RPC
		),
		parentDefaultOptions: { from },
		maticDefaultOptions: { from },
	});
	await matic.initialize();
	return { matic, network };
}

function getAccount() {
	if (!process.env.PRIVATE_KEY || !process.env.FROM) {
		throw new Error("Please set the PRIVATE_KEY/FROM env vars");
	}
	return { privateKey: process.env.PRIVATE_KEY, from: process.env.FROM };
}

module.exports = {
	SCALING_FACTOR,
	getMaticClient,
	getAccount,
};