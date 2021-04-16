/// <reference types="node" />
/// <reference types="bn.js" />
import { BN } from 'ethereumjs-util';
import { BufferLike, PrefixedHexString, TxData, TransactionOptions } from './types';
/**
 * An Ethereum transaction.
 */
export default class Transaction {
    raw: Buffer[];
    nonce: Buffer;
    gasLimit: Buffer;
    gasPrice: Buffer;
    to: Buffer;
    value: Buffer;
    data: Buffer;
    v: Buffer;
    r: Buffer;
    s: Buffer;
    private _common;
    private _senderPubKey?;
    protected _from?: Buffer;
    /**
     * Creates a new transaction from an object with its fields' values.
     *
     * @param data - A transaction can be initialized with its rlp representation, an array containing
     * the value of its fields in order, or an object containing them by name.
     *
     * @param opts - The transaction's options, used to indicate the chain and hardfork the
     * transactions belongs to.
     *
     * @note Transaction objects implement EIP155 by default. To disable it, use the constructor's
     * second parameter to set a chain and hardfork before EIP155 activation (i.e. before Spurious
     * Dragon.)
     *
     * @example
     * ```js
     * const txData = {
     *   nonce: '0x00',
     *   gasPrice: '0x09184e72a000',
     *   gasLimit: '0x2710',
     *   to: '0x0000000000000000000000000000000000000000',
     *   value: '0x00',
     *   data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
     *   v: '0x1c',
     *   r: '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
     *   s: '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
     * };
     * const tx = new Transaction(txData);
     * ```
     */
    constructor(data?: Buffer | PrefixedHexString | BufferLike[] | TxData, opts?: TransactionOptions);
    /**
     * If the tx's `to` is to the creation address
     */
    toCreationAddress(): boolean;
    /**
     * Computes a sha3-256 hash of the serialized tx
     * @param includeSignature - Whether or not to include the signature
     */
    hash(includeSignature?: boolean): Buffer;
    /**
     * returns chain ID
     */
    getChainId(): number;
    /**
     * returns the sender's address
     */
    getSenderAddress(): Buffer;
    /**
     * returns the public key of the sender
     */
    getSenderPublicKey(): Buffer;
    /**
     * Determines if the signature is valid
     */
    verifySignature(): boolean;
    /**
     * sign a transaction with a given private key
     * @param privateKey - Must be 32 bytes in length
     */
    sign(privateKey: Buffer): void;
    /**
     * The amount of gas paid for the data in this tx
     */
    getDataFee(): BN;
    /**
     * the minimum amount of gas the tx must have (DataFee + TxFee + Creation Fee)
     */
    getBaseFee(): BN;
    /**
     * the up front amount that an account must have for this transaction to be valid
     */
    getUpfrontCost(): BN;
    /**
     * Validates the signature and checks to see if it has enough gas.
     */
    validate(): boolean;
    validate(stringError: false): boolean;
    validate(stringError: true): string;
    /**
     * Returns the rlp encoding of the transaction
     */
    serialize(): Buffer;
    /**
     * Returns the transaction in JSON format
     * @see {@link https://github.com/ethereumjs/ethereumjs-util/blob/master/docs/index.md#defineproperties|ethereumjs-util}
     */
    toJSON(labels?: boolean): {
        [key: string]: string;
    } | string[];
    private _validateV;
    private _isSigned;
    private _overrideVSetterWithValidation;
    private _implementsEIP155;
}
