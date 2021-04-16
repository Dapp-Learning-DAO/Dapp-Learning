"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genesisStateByName = exports.genesisStateById = void 0;
var genesisStates = {
    names: {
        '1': 'mainnet',
        '3': 'ropsten',
        '4': 'rinkeby',
        '42': 'kovan',
        '5': 'goerli',
    },
    mainnet: require('./mainnet.json'),
    ropsten: require('./ropsten.json'),
    rinkeby: require('./rinkeby.json'),
    kovan: require('./kovan.json'),
    goerli: require('./goerli.json'),
};
/**
 * Returns the genesis state by network ID
 * @param id ID of the network (e.g. 1)
 * @returns Dictionary with genesis accounts
 */
function genesisStateById(id) {
    return genesisStates[genesisStates['names'][id]];
}
exports.genesisStateById = genesisStateById;
/**
 * Returns the genesis state by network name
 * @param name Name of the network (e.g. 'mainnet')
 * @returns Dictionary with genesis accounts
 */
function genesisStateByName(name) {
    return genesisStates[name];
}
exports.genesisStateByName = genesisStateByName;
//# sourceMappingURL=index.js.map