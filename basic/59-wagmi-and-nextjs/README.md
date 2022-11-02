# Wagmi and Nextjs

We will try to make a simple website of UniswapV2 by wagmi and nextjs.

## tech stacks

- React.js (hooks)
- TypeScript
- wagmi (React Hooks for Ethereum)
- etehrs
- Next.js (server-side rendering (SSR))
- rainbowkit (based on wagmi)
- styled-components (react css package)
- react-toastify (toast plugin)

### wagmi

**wagmi**(We all gonna make it!) is a collection of React Hooks containing everything you need to start working with Ethereum. wagmi makes it easy to "Connect Wallet," display ENS and balance information, sign messages, interact with contracts, and much more — all with caching, request deduplication, and persistence.

### Next.js

Next.js aims to have best-in-class developer experience and many built-in features, such as:

- An intuitive page-based routing system (with support for dynamic routes)
- Pre-rendering, both static generation (SSG) and server-side rendering (SSR) are supported on a per-page basis
- Automatic code splitting for faster page loads
- Client-side routing with optimized prefetching
- Built-in CSS and Sass support, and support for any CSS-in-JS library
- Development environment with Fast Refresh support
- API routes to build API endpoints with Serverless Functions
- Fully extendable

### Rainbow kit

RainbowKit is a React library that makes it easy to add wallet connection to your dapp. It's intuitive, responsive and customizable.

## Quick Start

```sh
cd uniswap-v2-interface-wagmi
yarn install
yarn dev
```

## Step-by-Step

### installation

Create dapp from templete which is base on react, typescript and styled-components.

```sh
yarn create next-app --example with-styled-components uniswap-v2-interface-wagmi
```

After install npm package, we get a starter in ./uniswap-v2-interface-wagmi. Then enter folder, if it works well, you will see website run at localhost:3000.

```sn
cd uniswap-v2-interface-wagmi/
yarn dev
```

Add wagmi, ethers, rainbowkit, react-toastify

```sh
yarn add wagmi ethers @rainbow-me/rainbowkit react-toastify
```

### Config Wagmi and Rainbowkit

Let's config wagmi and rainbowkit, so that our web2 website would transfer to web3 dapp.

import wagmi and rainbowkit.

```tsx
// pages/_app.tsx

import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
  chain,
  configureChains,
  createClient,
  WagmiConfig,
} from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { ToastContainer } from 'react-toastify';
import '@rainbow-me/rainbowkit/styles.css';
import 'react-toastify/dist/ReactToastify.css';

```

configure

```tsx
// pages/_app.tsx

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
  [
    alchemyProvider({ apiKey: process.env.ALCHEMY_ID }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  chains
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider
})
```

Add `<WagmiConfig>`, `<RainbowKitProvider>` to contain our page content in react node

```tsx
// pages/_app.tsx

<ThemeProvider theme={theme}>
  <WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains}>
      <GlobalStyle />
      <ToastContainer />
      <Component {...pageProps} />
    </RainbowKitProvider>
  </WagmiConfig>
</ThemeProvider>
```

Ofcourse, we also need to add ALCHEMY_ID in `.env`

```sh
ALCHEMY_ID=XXX
```

Change some text content, rename page name and file name.

- edit `components/cards.tsx`, make it to show multiple links
- change `pages/index.tsx` text content
- rename `abount.tsx` to `swap.tsx`

```tsx
// components/cards.tsx
// replace export default part
interface PageProp {
  href: string;
  name: string;
}
export default function Cards(props: { pages: PageProp[] }) {
  return (
    <FlexContainer>
      <Card>
        {props.pages.map((item, index) => (
          <StyledLink key={index} href={item.href} name={`${item.name}`} />
        ))}
      </Card>
    </FlexContainer>
  );
}

// pages/index.tsx
// change text content whatever you want

...

// pass our swap page path into Cards component
<Cards pages={[
  {href: '/swap', name: 'Swap page'},
]} />

// rename `abount.tsx` to `swap.tsx`

```

Then we get ready to make a uniswapv2 interface.

## Swap Page

First, add a connect wallet button. Just simply add it from rainbowkit, then our dapp already have connected wallet function, you could test it by clicking the button.

```tsx
// pages/swap.tsx

import { ConnectButton } from '@rainbow-me/rainbowkit';

...
<ConnectButton />
...
```

copy abi.json file from etherscan, put them in `abi/` folder, create `config/contractConfig.ts`, set some configuration of contracts.

```ts
// config/contractConfig.ts
// goerli testnet

import UniswapRouter2ABI from "../abi/UniswapRouter2ABI.json";
import WETHABI from "../abi/WETHABI.json";
import DaiABI from "../abi/DaiABI.json";

export const ROUTER2_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
export const WETH_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
export const DAI_ADDRESS = '0xf2edF1c091f683E3fb452497d9a98A49cBA84666'

export const router2ContractConfig = {
  address: ROUTER2_ADDRESS,
  abi: UniswapRouter2ABI,
};
export const wethContractConfig = {
  address: WETH_ADDRESS,
  abi: WETHABI,
}
export const daiContractConfig = {
  address: DAI_ADDRESS,
  abi: DaiABI,
}
```

Add some dom in swap.tsx (select token list and amount inputbox), give them some styles with setyled-components.

```tsx
// pages/swap.tsx
const tokens = [
  { name: 'WETH', config: wethContractConfig },
  { name: 'Dai', config: daiContractConfig },
];
export default function Swap() {
  const [inputIndex, setInputIndex] = useState(0);
  const [outputIndex, setOutputIndex] = useState(1);
  const [inputAmount, setInputAmount] = useState<BigNumber>(BigNumber.from("0"));
  const [outputAmount, setOutputAmount] = useState<BigNumber>(BigNumber.from("0"));

  return (
    ...
    <SwapBox>
    <TokenList>
      <h3>input token:</h3>
      {tokens.map((item, index) => (
        <label key={index}>
          <input name="inputToken" type="radio" checked={index == inputIndex} onChange={(e: any) => {
            setInputIndex(index)
            if (outputIndex == index) {
              setOutputIndex((index+1) % tokens.length)
            }
            }} />
          {item.name}
        </label>
      ))}
      <input type="text" value={formatEther(inputAmount)} onChange={(e:any) => {
        const value = e.target.value;
        if (value && value !== '') {
          setInputAmount(parseEther(value));
        } else {
          setInputAmount(BigNumber.from("0"))
        }
      }} />
    </TokenList>
    <TokenList>
      <h3>output token:</h3>
      {tokens.map((item, index) => (
        <label key={index}>
          <input name="outputToken" type="radio" checked={index == outputIndex} onChange={(e: any) => {
            setOutputIndex(index)
            if (inputIndex == index) {
              setInputIndex((index+1) % tokens.length)
            }
          }} />
          {item.name}
        </label>
      ))}
      <input type="text" value={formatEther(outputAmount)} disabled/>
    </TokenList>
  </SwapBox>
    ...
  );
}
```

UniswapV2 `Router2.getAmountsOut()` function will help us calculate outputToken amount. we could use wagmi hook `useContractRead`  to fetch contract function. The hook will return a `refetch` function which will be put in `useEffect` react hook. When a select token index or input amount changes, it will fetch a new result of getAmountsOut function.

```tsx
// pages/swap.tsx

const { isLoading: getAmountsOutLoading, refetch: getAmountsOutRefetch } = useContractRead({
  // fetch router2.getAmountsOut get output amount
  // function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts);
  ...router2ContractConfig,
  functionName: "getAmountsOut",
  args: [
    inputAmount,
    [
      tokens[inputIndex].config.address,
      tokens[outputIndex].config.address,
    ]
  ],
  // trigger condition: input and output are different token && inputAmount > 0
  enabled: inputIndex !== outputIndex && inputAmount.gt(BigNumber.from("0")),
  onSuccess(data: BigNumber) {
    if (data && data[1]) setOutputAmount(data[1])
  },
  onError(err) {
    // console.error(err)
    toast.error(JSON.stringify(err))
  }
});
```

same way add fetch allowance logstic. wagmi hook `useAccount` will return user's wallet addres and connecting status.

```tsx
// get user address from wagmi hook useAccount
const { address, isConnected } = useAccount();
const [isApproved, setIsApproved] = useState(false);

const { isLoading: allowanceLoading, refetch: allowanceRefetch } = useContractRead({
  // fetch outputToken.allowance
  // function allowance(address account, address spender) public view returns (uint);
  address: tokens[inputIndex].config.address,
  abi: tokens[inputIndex].config.abi,
  functionName: "allowance",
  enabled: isConnected,
  args: [address, router2ContractConfig.address],
  onSuccess(data: BigNumber) {
    if (data.gt(BigNumber.from("0"))) {
      setIsApproved(data.gte(outputAmount))
    } else {
      setIsApproved(false);
    }
  },
  onError(err) {
    toast.error(JSON.stringify(err))
  }
});
```

Refetch result when select index or input amount changes.

```tsx
// fetch getAmountsOut when select index or input amount changed
useEffect(() => {
  if (!getAmountsOutLoading && inputIndex !== outputIndex && inputAmount.gt(BigNumber.from("0"))) {
    getAmountsOutRefetch()
    allowanceRefetch()
  }
}, [inputIndex, inputAmount])
```

wagmi hook `usePrepareContractWrite` help us to eagerly fetches the parameters required for sending a contract write transaction such as the gas estimate. rainbowkit hook `useAddRecentTransaction` will add tx hash in rainbowkit when we send transcation.

```tsx
const toastId = useRef<Id | null>(null);
// addRecentTransaction will add tx hash in rainbowkit when send transcation
const addRecentTransaction = useAddRecentTransaction();

const { config: approveConfig } = usePrepareContractWrite({
  address: tokens[inputIndex].config.address,
  abi: tokens[inputIndex].config.abi,
  enabled: isConnected,
  functionName: "approve",
  args: [
    router2ContractConfig.address,
    constants.MaxUint256
  ],
  onError(err: any) {
    toast.error(JSON.stringify(err));
  },
});
```

hook `useContractWrite` is the acctually send transaction method, use prepare hook's result be its input params.

```tsx
const { write: approveWrite } = useContractWrite({
  ...approveConfig,
  onMutate(data) {
    toastId.current = toast("Please wait...", { isLoading: true });
  },
  onSuccess(data) {
    console.warn("writen contract approve:\n", data);
    // add pending tx hash in rainbowkit 
    addRecentTransaction({
      hash: data.hash,
      description: `approve`,
      confirmations: 1,
    });
    // wati tx confirmed 1 block
    data
      .wait(1)
      .then((res) => {
        console.warn("transaction confirmed", res);
        toast.update(toastId.current as Id, {
          render: "approve successfully",
          type: toast.TYPE.SUCCESS,
          isLoading: false,
          autoClose: 3_000,
        });
        setIsApproved(true);
      })
      .catch((err) => {
        console.error(err);
        toast.update(toastId.current as Id, {
          render: err,
          type: toast.TYPE.ERROR,
          isLoading: false,
        });
      });
  },
  onError(err: any) {
    toast.update(toastId.current as Id, {
      render: JSON.stringify(err),
      type: toast.TYPE.ERROR,
      isLoading: false,
      autoClose: 5_000,
    });
  },
});
```

The same way to add swap logstic. And add tow buttons in the dom, we've done!

You can find the final code in [pages/swap.tsx](./uniswap-v2-interface-wagmipages/swap.tsx).

## TODO

- liquidity page
- improve UI
- add ApolloClient to query subgraph

## Reference

- wagmi <https://wagmi.sh/>
- Next.js <https://nextjs.org/docs/getting-started>
- rainbowkit <https://www.rainbowkit.com/>
- styled-components <https://github.com/styled-components/styled-components>
- [Client-side vs. server-side rendering: why it’s not all black and white](https://www.freecodecamp.org/news/what-exactly-is-client-side-rendering-and-hows-it-different-from-server-side-rendering-bd5c786b340d/)
- UniswapV2 docs <https://docs.uniswap.org/protocol/V2/reference/smart-contracts/router-02>
