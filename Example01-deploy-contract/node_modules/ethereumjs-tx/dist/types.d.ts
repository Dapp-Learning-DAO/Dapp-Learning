/// <reference types="node" />
import Common from 'ethereumjs-common';
/**
 * Any object that can be transformed into a `Buffer`
 */
export interface TransformableToBuffer {
    toBuffer(): Buffer;
}
/**
 * A hex string prefixed with `0x`.
 */
export declare type PrefixedHexString = string;
/**
 * A Buffer, hex string prefixed with `0x`, Number, or an object with a toBuffer method such as BN.
 */
export declare type BufferLike = Buffer | TransformableToBuffer | PrefixedHexString | number;
/**
 * A transaction's data.
 */
export interface TxData {
    /**
     * The transaction's gas limit.
     */
    gasLimit?: BufferLike;
    /**
     * The transaction's gas price.
     */
    gasPrice?: BufferLike;
    /**
     * The transaction's the address is sent to.
     */
    to?: BufferLike;
    /**
     * The transaction's nonce.
     */
    nonce?: BufferLike;
    /**
     * This will contain the data of the message or the init of a contract
     */
    data?: BufferLike;
    /**
     * EC recovery ID.
     */
    v?: BufferLike;
    /**
     * EC signature parameter.
     */
    r?: BufferLike;
    /**
     * EC signature parameter.
     */
    s?: BufferLike;
    /**
     * The amount of Ether sent.
     */
    value?: BufferLike;
}
/**
 * The data of a fake (self-signing) transaction.
 */
export interface FakeTxData extends TxData {
    /**
     * The sender of the Tx.
     */
    from?: BufferLike;
}
/**
 * The transaction's options. This could be specified using a Common object, or `chain` and `hardfork`. Defaults to
 * mainnet.
 */
export interface TransactionOptions {
    /**
     * A Common object defining the chain and the hardfork a transaction belongs to.
     */
    common?: Common;
    /**
     * The chain of the transaction, default: 'mainnet'
     */
    chain?: number | string;
    /**
     * The hardfork of the transaction, default: 'petersburg'
     */
    hardfork?: string;
}
