import { defineChain } from "viem";

export const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "GO",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});
