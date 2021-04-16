/// <reference types="node" />
import BN = require('bn.js');
export declare type Input = Buffer | string | number | bigint | Uint8Array | BN | List | null;
export interface List extends Array<Input> {
}
export interface Decoded {
    data: Buffer | Buffer[];
    remainder: Buffer;
}
