/// <reference types="node" />
import { BufferLike, FakeTxData, PrefixedHexString, TransactionOptions } from './types';
import Transaction from './transaction';
/**
 * Creates a new transaction object that doesn't need to be signed.
 *
 * @param data - A transaction can be initialized with its rlp representation, an array containing
 * the value of its fields in order, or an object containing them by name.
 *
 * @param opts - The transaction's options, used to indicate the chain and hardfork the
 * transactions belongs to.
 *
 * @see Transaction
 */
export default class FakeTransaction extends Transaction {
    /**
     * Set from address to bypass transaction signing.
     * This is not an optional property, as its getter never returns undefined.
     */
    from: Buffer;
    constructor(data?: Buffer | PrefixedHexString | BufferLike[] | FakeTxData, opts?: TransactionOptions);
    /**
     * Computes a sha3-256 hash of the serialized tx, using the sender address to generate a fake
     * signature.
     *
     * @param includeSignature - Whether or not to include the signature
     */
    hash(includeSignature?: boolean): Buffer;
}
