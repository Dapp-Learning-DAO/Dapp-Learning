import axios, { AxiosResponse } from "axios";

const blockstream = new axios.Axios({
  baseURL: `https://blockstream.info/testnet/api`,
  proxy: false
});

export async function waitUntilUTXO(address: string) {
  return new Promise<IUTXO[]>((resolve, reject) => {
    let intervalId: any;
    const checkForUtxo = async () => {
      try {
        const response: AxiosResponse<string> = await blockstream.get(`/address/${address}/utxo`);
        const data: IUTXO[] = response.data ? JSON.parse(response.data) : undefined;
        // console.log(`utxos = `, data);
        if (data.length > 0) {
          resolve(data);
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    intervalId = setInterval(checkForUtxo, 10000);
  });
}

export async function broadcast(txHex: string) {
  const response: AxiosResponse<string> = await blockstream.post('/tx', txHex);
  return response.data;
}


export async function getTxData(txid: string) {
  return new Promise<ITxData>((resolve, reject) => {
    let intervalId: any;
    const fetchTxData = async () => {
      try {
        const response: AxiosResponse<string> = await blockstream.get(`/tx/${txid}`);
        const data: ITxData = response.data ? JSON.parse(response.data) : undefined;
        if (data) {
          resolve(data);
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    intervalId = setInterval(fetchTxData, 10000);
  });
}

export async function getTxHex(txid: string) {
  return new Promise<string>((resolve, reject) => {
    let intervalId: any;
    const fetchTxData = async () => {
      try {
        const response: AxiosResponse<string> = await blockstream.get(`/tx/${txid}/hex`);
        // console.log(`getTxHex response = `, response)
        const data: string = response.data ? response.data : undefined;
        if (data) {
          resolve(data);
          clearInterval(intervalId);
        }
      } catch (error) {
        reject(error);
        clearInterval(intervalId);
      }
    };
    intervalId = setInterval(fetchTxData, 10000);
  });
}

interface IUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}


export interface Prevout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
}

export interface Vin {
  txid: string;
  vout: number;
  prevout: Prevout;
  scriptsig: string;
  scriptsig_asm: string;
  witness: string[];
  is_coinbase: boolean;
  sequence: number;
}

export interface Vout {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address: string;
  value: number;
}

export interface Statu {
  confirmed: boolean;
}

export interface ITxData {
  txid: string;
  version: number;
  locktime: number;
  vin: Vin[];
  vout: Vout[];
  size: number;
  weight: number;
  fee: number;
  status: Statu;
}
