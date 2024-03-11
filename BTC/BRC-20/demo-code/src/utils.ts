import {
  initEccLib,
  crypto,
  address,
  script,
  networks
} from "bitcoinjs-lib";
import { ECPairFactory } from 'ecpair';
import * as tinysecp from 'tiny-secp256k1';
import type { Network, Signer } from "bitcoinjs-lib";
import type { ECPairAPI, TinySecp256k1Interface } from 'ecpair';

initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);

export function tweakSigner(signer: Signer, opts: any = {}): Signer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error('Private key is required for tweaking signer!');
  }
  if (signer.publicKey[0] === 3) {
    privateKey = tinysecp.privateNegate(privateKey);
  }

  const tweakedPrivateKey = tinysecp.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash),
  );
  if (!tweakedPrivateKey) {
    throw new Error('Invalid tweaked private key!');
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

export function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return crypto.taggedHash(
    'TapTweak',
    Buffer.concat(h ? [pubKey, h] : [pubKey]),
  );
}

export function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33)
}

export const MAXIMUM_SCRIPT_ELEMENT_SIZE = 520

export function opPush(data: string | Buffer) {
  const buff = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8")
  if (buff.byteLength > MAXIMUM_SCRIPT_ELEMENT_SIZE)
    throw new Error("Data is too large to push. Use chunkContent to split data into smaller chunks")
  return Buffer.concat([buff])
}

import varuint from "varuint-bitcoin";

/**
 * Helper function that produces a serialized witness script
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/csv.spec.ts#L477
 */
export function witnessStackToScriptWitness(witness: Buffer[]) {
  let buffer = Buffer.allocUnsafe(0)

  function writeSlice(slice: Buffer) {
    buffer = Buffer.concat([buffer, Buffer.from(slice)])
  }

  function writeVarInt(i: number) {
    const currentLen = buffer.length;
    const varintLen = varuint.encodingLength(i)

    buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)])
    varuint.encode(i, buffer, currentLen)
  }

  function writeVarSlice(slice: Buffer) {
    writeVarInt(slice.length)
    writeSlice(slice)
  }

  function writeVector(vector: Buffer[]) {
    writeVarInt(vector.length)
    vector.forEach(writeVarSlice)
  }

  writeVector(witness)

  return buffer
}

export function addressToScriptPubKey(bitcoinAddress: string, network: Network) {
  let scriptPubKey = address.toOutputScript(bitcoinAddress, network);
  return scriptPubKey.toString('hex');
}

export function scriptToAddress(
  scriptHex: string,
  network: Network,
): string {
  const scriptBuffer = Buffer.from(scriptHex, 'hex');
  const convertedAddress = address.fromOutputScript(scriptBuffer, network);
  return convertedAddress;
}

export function decodeScript(scriptHex: string) {
  const scriptBuffer = Buffer.from(scriptHex, 'hex');
  const scriptASM = script.toASM(scriptBuffer);
  return scriptASM;
}