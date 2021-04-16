import { Chain } from './types';
interface hardforkOptions {
    /** optional, only allow supported HFs (default: false) */
    onlySupported?: boolean;
    /** optional, only active HFs (default: false) */
    onlyActive?: boolean;
}
/**
 * Common class to access chain and hardfork parameters
 */
export default class Common {
    private _hardfork;
    private _supportedHardforks;
    private _chainParams;
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
    static forCustomChain(baseChain: string | number, customChainParams: Partial<Chain>, hardfork?: string | null, supportedHardforks?: Array<string>): Common;
    private static _getChainParams;
    /**
     * @constructor
     * @param chain String ('mainnet') or Number (1) chain
     * @param hardfork String identifier ('byzantium') for hardfork (optional)
     * @param supportedHardforks Limit parameter returns to the given hardforks (optional)
     */
    constructor(chain: string | number | object, hardfork?: string | null, supportedHardforks?: Array<string>);
    /**
     * Sets the chain
     * @param chain String ('mainnet') or Number (1) chain
     *     representation. Or, a Dictionary of chain parameters for a private network.
     * @returns The dictionary with parameters set as chain
     */
    setChain(chain: string | number | object): any;
    /**
     * Sets the hardfork to get params for
     * @param hardfork String identifier ('byzantium')
     */
    setHardfork(hardfork: string | null): void;
    /**
     * Internal helper function to choose between hardfork set and hardfork provided as param
     * @param hardfork Hardfork given to function as a parameter
     * @returns Hardfork chosen to be used
     */
    _chooseHardfork(hardfork?: string | null, onlySupported?: boolean): string;
    /**
     * Internal helper function, returns the params for the given hardfork for the chain set
     * @param hardfork Hardfork name
     * @returns Dictionary with hardfork params
     */
    _getHardfork(hardfork: string): any;
    /**
     * Internal helper function to check if a hardfork is set to be supported by the library
     * @param hardfork Hardfork name
     * @returns True if hardfork is supported
     */
    _isSupportedHardfork(hardfork: string | null): boolean;
    /**
     * Returns the parameter corresponding to a hardfork
     * @param topic Parameter topic ('gasConfig', 'gasPrices', 'vm', 'pow', 'casper', 'sharding')
     * @param name Parameter name (e.g. 'minGasLimit' for 'gasConfig' topic)
     * @param hardfork Hardfork name, optional if hardfork set
     */
    param(topic: string, name: string, hardfork?: string): any;
    /**
     * Returns a parameter for the hardfork active on block number
     * @param topic Parameter topic
     * @param name Parameter name
     * @param blockNumber Block number
     */
    paramByBlock(topic: string, name: string, blockNumber: number): any;
    /**
     * Checks if set or provided hardfork is active on block number
     * @param hardfork Hardfork name or null (for HF set)
     * @param blockNumber
     * @param opts Hardfork options (onlyActive unused)
     * @returns True if HF is active on block number
     */
    hardforkIsActiveOnBlock(hardfork: string | null, blockNumber: number, opts?: hardforkOptions): boolean;
    /**
     * Alias to hardforkIsActiveOnBlock when hardfork is set
     * @param blockNumber
     * @param opts Hardfork options (onlyActive unused)
     * @returns True if HF is active on block number
     */
    activeOnBlock(blockNumber: number, opts?: hardforkOptions): boolean;
    /**
     * Sequence based check if given or set HF1 is greater than or equal HF2
     * @param hardfork1 Hardfork name or null (if set)
     * @param hardfork2 Hardfork name
     * @param opts Hardfork options
     * @returns True if HF1 gte HF2
     */
    hardforkGteHardfork(hardfork1: string | null, hardfork2: string, opts?: hardforkOptions): boolean;
    /**
     * Alias to hardforkGteHardfork when hardfork is set
     * @param hardfork Hardfork name
     * @param opts Hardfork options
     * @returns True if hardfork set is greater than hardfork provided
     */
    gteHardfork(hardfork: string, opts?: hardforkOptions): boolean;
    /**
     * Checks if given or set hardfork is active on the chain
     * @param hardfork Hardfork name, optional if HF set
     * @param opts Hardfork options (onlyActive unused)
     * @returns True if hardfork is active on the chain
     */
    hardforkIsActiveOnChain(hardfork?: string | null, opts?: hardforkOptions): boolean;
    /**
     * Returns the active hardfork switches for the current chain
     * @param blockNumber up to block if provided, otherwise for the whole chain
     * @param opts Hardfork options (onlyActive unused)
     * @return Array with hardfork arrays
     */
    activeHardforks(blockNumber?: number | null, opts?: hardforkOptions): Array<any>;
    /**
     * Returns the latest active hardfork name for chain or block or throws if unavailable
     * @param blockNumber up to block if provided, otherwise for the whole chain
     * @param opts Hardfork options (onlyActive unused)
     * @return Hardfork name
     */
    activeHardfork(blockNumber?: number | null, opts?: hardforkOptions): string;
    /**
     * Returns the hardfork change block for hardfork provided or set
     * @param hardfork Hardfork name, optional if HF set
     * @returns Block number
     */
    hardforkBlock(hardfork?: string): number;
    /**
     * True if block number provided is the hardfork (given or set) change block of the current chain
     * @param blockNumber Number of the block to check
     * @param hardfork Hardfork name, optional if HF set
     * @returns True if blockNumber is HF block
     */
    isHardforkBlock(blockNumber: number, hardfork?: string): boolean;
    /**
     * Provide the consensus type for the hardfork set or provided as param
     * @param hardfork Hardfork name, optional if hardfork set
     * @returns Consensus type (e.g. 'pow', 'poa')
     */
    consensus(hardfork?: string): string;
    /**
     * Provide the finality type for the hardfork set or provided as param
     * @param {String} hardfork Hardfork name, optional if hardfork set
     * @returns {String} Finality type (e.g. 'pos', null of no finality)
     */
    finality(hardfork?: string): string;
    /**
     * Returns the Genesis parameters of current chain
     * @returns Genesis dictionary
     */
    genesis(): any;
    /**
     * Returns the hardforks for current chain
     * @returns {Array} Array with arrays of hardforks
     */
    hardforks(): any;
    /**
     * Returns bootstrap nodes for the current chain
     * @returns {Dictionary} Dict with bootstrap nodes
     */
    bootstrapNodes(): any;
    /**
     * Returns the hardfork set
     * @returns Hardfork name
     */
    hardfork(): string | null;
    /**
     * Returns the Id of current chain
     * @returns chain Id
     */
    chainId(): number;
    /**
     * Returns the name of current chain
     * @returns chain name (lower case)
     */
    chainName(): string;
    /**
     * Returns the Id of current network
     * @returns network Id
     */
    networkId(): number;
}
export {};
