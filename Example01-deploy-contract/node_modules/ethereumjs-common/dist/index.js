"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var chains_1 = require("./chains");
var hardforks_1 = require("./hardforks");
/**
 * Common class to access chain and hardfork parameters
 */
var Common = /** @class */ (function () {
    /**
     * @constructor
     * @param chain String ('mainnet') or Number (1) chain
     * @param hardfork String identifier ('byzantium') for hardfork (optional)
     * @param supportedHardforks Limit parameter returns to the given hardforks (optional)
     */
    function Common(chain, hardfork, supportedHardforks) {
        this._chainParams = this.setChain(chain);
        this._hardfork = null;
        this._supportedHardforks = supportedHardforks === undefined ? [] : supportedHardforks;
        if (hardfork) {
            this.setHardfork(hardfork);
        }
    }
    /**
     * Creates a Common object for a custom chain, based on a standard one. It uses all the [[Chain]]
     * params from [[baseChain]] except the ones overridden in [[customChainParams]].
     *
     * @param baseChain The name (`mainnet`) or id (`1`) of a standard chain used to base the custom
     * chain params on.
     * @param customChainParams The custom parameters of the chain.
     * @param hardfork String identifier ('byzantium') for hardfork (optional)
     * @param supportedHardforks Limit parameter returns to the given hardforks (optional)
     */
    Common.forCustomChain = function (baseChain, customChainParams, hardfork, supportedHardforks) {
        var standardChainParams = Common._getChainParams(baseChain);
        return new Common(__assign(__assign({}, standardChainParams), customChainParams), hardfork, supportedHardforks);
    };
    Common._getChainParams = function (chain) {
        if (typeof chain === 'number') {
            if (chains_1.chains['names'][chain]) {
                return chains_1.chains[chains_1.chains['names'][chain]];
            }
            throw new Error("Chain with ID " + chain + " not supported");
        }
        if (chains_1.chains[chain]) {
            return chains_1.chains[chain];
        }
        throw new Error("Chain with name " + chain + " not supported");
    };
    /**
     * Sets the chain
     * @param chain String ('mainnet') or Number (1) chain
     *     representation. Or, a Dictionary of chain parameters for a private network.
     * @returns The dictionary with parameters set as chain
     */
    Common.prototype.setChain = function (chain) {
        if (typeof chain === 'number' || typeof chain === 'string') {
            this._chainParams = Common._getChainParams(chain);
        }
        else if (typeof chain === 'object') {
            var required = ['networkId', 'genesis', 'hardforks', 'bootstrapNodes'];
            for (var _i = 0, required_1 = required; _i < required_1.length; _i++) {
                var param = required_1[_i];
                if (chain[param] === undefined) {
                    throw new Error("Missing required chain parameter: " + param);
                }
            }
            this._chainParams = chain;
        }
        else {
            throw new Error('Wrong input format');
        }
        return this._chainParams;
    };
    /**
     * Sets the hardfork to get params for
     * @param hardfork String identifier ('byzantium')
     */
    Common.prototype.setHardfork = function (hardfork) {
        if (!this._isSupportedHardfork(hardfork)) {
            throw new Error("Hardfork " + hardfork + " not set as supported in supportedHardforks");
        }
        var changed = false;
        for (var _i = 0, hardforkChanges_1 = hardforks_1.hardforks; _i < hardforkChanges_1.length; _i++) {
            var hfChanges = hardforkChanges_1[_i];
            if (hfChanges[0] === hardfork) {
                this._hardfork = hardfork;
                changed = true;
            }
        }
        if (!changed) {
            throw new Error("Hardfork with name " + hardfork + " not supported");
        }
    };
    /**
     * Internal helper function to choose between hardfork set and hardfork provided as param
     * @param hardfork Hardfork given to function as a parameter
     * @returns Hardfork chosen to be used
     */
    Common.prototype._chooseHardfork = function (hardfork, onlySupported) {
        onlySupported = onlySupported === undefined ? true : onlySupported;
        if (!hardfork) {
            if (!this._hardfork) {
                throw new Error('Method called with neither a hardfork set nor provided by param');
            }
            else {
                hardfork = this._hardfork;
            }
        }
        else if (onlySupported && !this._isSupportedHardfork(hardfork)) {
            throw new Error("Hardfork " + hardfork + " not set as supported in supportedHardforks");
        }
        return hardfork;
    };
    /**
     * Internal helper function, returns the params for the given hardfork for the chain set
     * @param hardfork Hardfork name
     * @returns Dictionary with hardfork params
     */
    Common.prototype._getHardfork = function (hardfork) {
        var hfs = this.hardforks();
        for (var _i = 0, hfs_1 = hfs; _i < hfs_1.length; _i++) {
            var hf = hfs_1[_i];
            if (hf['name'] === hardfork)
                return hf;
        }
        throw new Error("Hardfork " + hardfork + " not defined for chain " + this.chainName());
    };
    /**
     * Internal helper function to check if a hardfork is set to be supported by the library
     * @param hardfork Hardfork name
     * @returns True if hardfork is supported
     */
    Common.prototype._isSupportedHardfork = function (hardfork) {
        if (this._supportedHardforks.length > 0) {
            for (var _i = 0, _a = this._supportedHardforks; _i < _a.length; _i++) {
                var supportedHf = _a[_i];
                if (hardfork === supportedHf)
                    return true;
            }
        }
        else {
            return true;
        }
        return false;
    };
    /**
     * Returns the parameter corresponding to a hardfork
     * @param topic Parameter topic ('gasConfig', 'gasPrices', 'vm', 'pow', 'casper', 'sharding')
     * @param name Parameter name (e.g. 'minGasLimit' for 'gasConfig' topic)
     * @param hardfork Hardfork name, optional if hardfork set
     */
    Common.prototype.param = function (topic, name, hardfork) {
        hardfork = this._chooseHardfork(hardfork);
        var value;
        for (var _i = 0, hardforkChanges_2 = hardforks_1.hardforks; _i < hardforkChanges_2.length; _i++) {
            var hfChanges = hardforkChanges_2[_i];
            if (!hfChanges[1][topic]) {
                throw new Error("Topic " + topic + " not defined");
            }
            if (hfChanges[1][topic][name] !== undefined) {
                value = hfChanges[1][topic][name].v;
            }
            if (hfChanges[0] === hardfork)
                break;
        }
        if (value === undefined) {
            throw new Error(topic + " value for " + name + " not found");
        }
        return value;
    };
    /**
     * Returns a parameter for the hardfork active on block number
     * @param topic Parameter topic
     * @param name Parameter name
     * @param blockNumber Block number
     */
    Common.prototype.paramByBlock = function (topic, name, blockNumber) {
        var activeHfs = this.activeHardforks(blockNumber);
        var hardfork = activeHfs[activeHfs.length - 1]['name'];
        return this.param(topic, name, hardfork);
    };
    /**
     * Checks if set or provided hardfork is active on block number
     * @param hardfork Hardfork name or null (for HF set)
     * @param blockNumber
     * @param opts Hardfork options (onlyActive unused)
     * @returns True if HF is active on block number
     */
    Common.prototype.hardforkIsActiveOnBlock = function (hardfork, blockNumber, opts) {
        opts = opts !== undefined ? opts : {};
        var onlySupported = opts.onlySupported === undefined ? false : opts.onlySupported;
        hardfork = this._chooseHardfork(hardfork, onlySupported);
        var hfBlock = this.hardforkBlock(hardfork);
        if (hfBlock !== null && blockNumber >= hfBlock)
            return true;
        return false;
    };
    /**
     * Alias to hardforkIsActiveOnBlock when hardfork is set
     * @param blockNumber
     * @param opts Hardfork options (onlyActive unused)
     * @returns True if HF is active on block number
     */
    Common.prototype.activeOnBlock = function (blockNumber, opts) {
        return this.hardforkIsActiveOnBlock(null, blockNumber, opts);
    };
    /**
     * Sequence based check if given or set HF1 is greater than or equal HF2
     * @param hardfork1 Hardfork name or null (if set)
     * @param hardfork2 Hardfork name
     * @param opts Hardfork options
     * @returns True if HF1 gte HF2
     */
    Common.prototype.hardforkGteHardfork = function (hardfork1, hardfork2, opts) {
        opts = opts !== undefined ? opts : {};
        var onlyActive = opts.onlyActive === undefined ? false : opts.onlyActive;
        hardfork1 = this._chooseHardfork(hardfork1, opts.onlySupported);
        var hardforks;
        if (onlyActive) {
            hardforks = this.activeHardforks(null, opts);
        }
        else {
            hardforks = this.hardforks();
        }
        var posHf1 = -1, posHf2 = -1;
        var index = 0;
        for (var _i = 0, hardforks_2 = hardforks; _i < hardforks_2.length; _i++) {
            var hf = hardforks_2[_i];
            if (hf['name'] === hardfork1)
                posHf1 = index;
            if (hf['name'] === hardfork2)
                posHf2 = index;
            index += 1;
        }
        return posHf1 >= posHf2;
    };
    /**
     * Alias to hardforkGteHardfork when hardfork is set
     * @param hardfork Hardfork name
     * @param opts Hardfork options
     * @returns True if hardfork set is greater than hardfork provided
     */
    Common.prototype.gteHardfork = function (hardfork, opts) {
        return this.hardforkGteHardfork(null, hardfork, opts);
    };
    /**
     * Checks if given or set hardfork is active on the chain
     * @param hardfork Hardfork name, optional if HF set
     * @param opts Hardfork options (onlyActive unused)
     * @returns True if hardfork is active on the chain
     */
    Common.prototype.hardforkIsActiveOnChain = function (hardfork, opts) {
        opts = opts !== undefined ? opts : {};
        var onlySupported = opts.onlySupported === undefined ? false : opts.onlySupported;
        hardfork = this._chooseHardfork(hardfork, onlySupported);
        for (var _i = 0, _a = this.hardforks(); _i < _a.length; _i++) {
            var hf = _a[_i];
            if (hf['name'] === hardfork && hf['block'] !== null)
                return true;
        }
        return false;
    };
    /**
     * Returns the active hardfork switches for the current chain
     * @param blockNumber up to block if provided, otherwise for the whole chain
     * @param opts Hardfork options (onlyActive unused)
     * @return Array with hardfork arrays
     */
    Common.prototype.activeHardforks = function (blockNumber, opts) {
        opts = opts !== undefined ? opts : {};
        var activeHardforks = [];
        var hfs = this.hardforks();
        for (var _i = 0, hfs_2 = hfs; _i < hfs_2.length; _i++) {
            var hf = hfs_2[_i];
            if (hf['block'] === null)
                continue;
            if (blockNumber !== undefined && blockNumber !== null && blockNumber < hf['block'])
                break;
            if (opts.onlySupported && !this._isSupportedHardfork(hf['name']))
                continue;
            activeHardforks.push(hf);
        }
        return activeHardforks;
    };
    /**
     * Returns the latest active hardfork name for chain or block or throws if unavailable
     * @param blockNumber up to block if provided, otherwise for the whole chain
     * @param opts Hardfork options (onlyActive unused)
     * @return Hardfork name
     */
    Common.prototype.activeHardfork = function (blockNumber, opts) {
        opts = opts !== undefined ? opts : {};
        var activeHardforks = this.activeHardforks(blockNumber, opts);
        if (activeHardforks.length > 0) {
            return activeHardforks[activeHardforks.length - 1]['name'];
        }
        else {
            throw new Error("No (supported) active hardfork found");
        }
    };
    /**
     * Returns the hardfork change block for hardfork provided or set
     * @param hardfork Hardfork name, optional if HF set
     * @returns Block number
     */
    Common.prototype.hardforkBlock = function (hardfork) {
        hardfork = this._chooseHardfork(hardfork, false);
        return this._getHardfork(hardfork)['block'];
    };
    /**
     * True if block number provided is the hardfork (given or set) change block of the current chain
     * @param blockNumber Number of the block to check
     * @param hardfork Hardfork name, optional if HF set
     * @returns True if blockNumber is HF block
     */
    Common.prototype.isHardforkBlock = function (blockNumber, hardfork) {
        hardfork = this._chooseHardfork(hardfork, false);
        if (this.hardforkBlock(hardfork) === blockNumber) {
            return true;
        }
        else {
            return false;
        }
    };
    /**
     * Provide the consensus type for the hardfork set or provided as param
     * @param hardfork Hardfork name, optional if hardfork set
     * @returns Consensus type (e.g. 'pow', 'poa')
     */
    Common.prototype.consensus = function (hardfork) {
        hardfork = this._chooseHardfork(hardfork);
        return this._getHardfork(hardfork)['consensus'];
    };
    /**
     * Provide the finality type for the hardfork set or provided as param
     * @param {String} hardfork Hardfork name, optional if hardfork set
     * @returns {String} Finality type (e.g. 'pos', null of no finality)
     */
    Common.prototype.finality = function (hardfork) {
        hardfork = this._chooseHardfork(hardfork);
        return this._getHardfork(hardfork)['finality'];
    };
    /**
     * Returns the Genesis parameters of current chain
     * @returns Genesis dictionary
     */
    Common.prototype.genesis = function () {
        return this._chainParams['genesis'];
    };
    /**
     * Returns the hardforks for current chain
     * @returns {Array} Array with arrays of hardforks
     */
    Common.prototype.hardforks = function () {
        return this._chainParams['hardforks'];
    };
    /**
     * Returns bootstrap nodes for the current chain
     * @returns {Dictionary} Dict with bootstrap nodes
     */
    Common.prototype.bootstrapNodes = function () {
        return this._chainParams['bootstrapNodes'];
    };
    /**
     * Returns the hardfork set
     * @returns Hardfork name
     */
    Common.prototype.hardfork = function () {
        return this._hardfork;
    };
    /**
     * Returns the Id of current chain
     * @returns chain Id
     */
    Common.prototype.chainId = function () {
        return this._chainParams['chainId'];
    };
    /**
     * Returns the name of current chain
     * @returns chain name (lower case)
     */
    Common.prototype.chainName = function () {
        return chains_1.chains['names'][this.chainId()] || this._chainParams['name'];
    };
    /**
     * Returns the Id of current network
     * @returns network Id
     */
    Common.prototype.networkId = function () {
        return this._chainParams['networkId'];
    };
    return Common;
}());
exports.default = Common;
//# sourceMappingURL=index.js.map