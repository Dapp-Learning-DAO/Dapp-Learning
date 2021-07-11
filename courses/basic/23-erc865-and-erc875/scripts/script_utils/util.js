/* eslint-disable import/no-extraneous-dependencies */
const Promise = require('bluebird');
const csv = require('fast-csv');
const fs = require('fs');

const gasPrice = () => 20 * (10 ** 9);
const gasLimit = (type) => {
	switch (type) {
		case 'attribute': // assign attribute to specific address
			return 60000;
		case 'transfer':
			return 70000;
		case 'multisig':
			return 250000;
		case 'setEntitiesViaMultisig':
			return 600000;
		case 'deployJurisdiction':
			return 7473430;
		case 'addAttribute': // add attribute to jurisdiction contract
			return 150000;
		case 'addValidator': // add attribute to jurisdiction contract
			return 120000;
		case 'allowValidatorAttribute': // allow validator to assign attribute
			return 100000;
		case 'validateAddress': // allow validator to assign attribute
			return 60000;
		case 'vestingContract': // token vestion proxy (864753)
			return 1100000;
		case 'rewardtest':
			return 5000000;
		default:
			return 100000;
	}
};

const duration = {
	seconds(val) { return val; },
	minutes(val) { return val * this.seconds(60); },
	hours(val) { return val * this.minutes(60); },
	days(val) { return val * this.hours(24); },
	weeks(val) { return val * this.days(7); },
	years(val) { return val * this.days(365); },
};

// nonces is the global variable that holds the current nonces per address
const getAndIncrementNonce = (nonces, address) => {
	const nonce = nonces[address];
	// eslint-disable-next-line no-param-reassign
	nonces[address] += 1;
	console.log(`Got nonce ${nonce} for ${address} and incremented to ${nonces[address]}`);
	return nonce;
};

// nonces is the global variable that holds the current nonces per address
const getNonce = (nonces, address) => {
	const nonce = nonces[address];
	console.log(`Got nonce ${nonce} for ${address} ${nonces[address]}`);
	return nonce;
};

const timeStamp = () => {
	// Create a date object with the current time
	const now = new Date();
	// Create an array with the current month, day and time
	const date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
	// Create an array with the current hour, minute and second
	const time = [now.getHours(), now.getMinutes(), now.getSeconds()];
	// Determine AM or PM suffix based on the hour
	const suffix = (time[0] < 12) ? 'AM' : 'PM';
	// Convert hour from military time
	time[0] = (time[0] < 12) ? time[0] : time[0] - 12;
	// If hour is 0, set it to 12
	time[0] = time[0] || 12;
	// If seconds and minutes are less than 10, add a zero
	for (let i = 1; i < 3; i += 1) {
		if (time[i] < 10) {
			time[i] = `0${time[i]}`;
		}
	}
	// Return the formatted string
	return `${date.join('/')} ${time.join(':')} ${suffix}`;
};

const hasTPLContract = () => false;
const getMaxVestingContractCreationRetries = () => 3;

const getCSVData = (filename) => new Promise((resolve, reject) => {
	const rows = [];
	const stream = fs.createReadStream(filename);
	
	const csvStream = csv()
		.on("data", function(data){
			//  console.log(data);
			rows.push(data);
		})
		.on("end", function(){
			resolve(rows);
		});
	
	stream.pipe(csvStream);
	
});

const getEventData = (contract, eventName) => new Promise((resolve, reject) => {
	console.log(eventName + ':::::'+JSON.stringify(contract));
	const event = contract[eventName]();
	event.watch();
	event.get((error, logs) => {
		if (error) {
			reject(error);
		} else {
			resolve(logs);
		}
	});
	event.stopWatching();
});

exports.gasLimit = gasLimit;
exports.gasPrice = gasPrice;
exports.duration = duration;
exports.getAndIncrementNonce = getAndIncrementNonce;
exports.getNonce = getNonce;
exports.timeStamp = timeStamp;
exports.hasTPLContract = hasTPLContract;
exports.getEventData = getEventData;
exports.getMaxVestingContractCreationRetries = getMaxVestingContractCreationRetries;
exports.getCSVData = getCSVData;