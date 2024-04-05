import { http, createConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
});
