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

Add wagmi, ethers, rainbowkit

```sh
yarn add wagmi ethers @rainbow-me/rainbowkit
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
import '@rainbow-me/rainbowkit/styles.css';

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

## Reference

- wagmi <https://wagmi.sh/>
- Next.js <https://nextjs.org/docs/getting-started>
- rainbowkit <https://www.rainbowkit.com/>
- styled-components <https://github.com/styled-components/styled-components>
- [Client-side vs. server-side rendering: why it’s not all black and white](https://www.freecodecamp.org/news/what-exactly-is-client-side-rendering-and-hows-it-different-from-server-side-rendering-bd5c786b340d/)
