// Import core components and styles
import './App.css';

// WalletConnect and Wagmi imports
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal, Web3Button, Web3NetworkSwitch } from '@web3modal/react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, arbitrum, polygon, localhost } from 'wagmi/chains';

// Define chains and project ID
const chains = [mainnet, arbitrum, polygon, localhost];
const projectId = process.env.REACT_APP_PROJECT_ID || "453f2a8e1d89bc35b8bc49eb781167b9";

// Configure Wagmi client and Ethereum client
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

function App() {
  return (
    <div>
      <WagmiConfig config={wagmiConfig}>
        <HomePage />
      </WagmiConfig>

      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </div>
  );
}

function HomePage() {
  return (
    <div className="homepage">
      <Web3NetworkSwitch />
      <Web3Button style={{ marginTop: '20px' }} />
    </div>
  );
}


export default App;
