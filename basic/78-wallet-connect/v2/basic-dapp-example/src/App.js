//Ignore this
import Button from '@material-ui/core/Button';
import './App.css';

//WalletConnect basic imports
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'

//WalletConenct UI components
import { Web3Modal } from '@web3modal/react';
import { Web3Button } from '@web3modal/react';
import { Web3NetworkSwitch } from '@web3modal/react';
import { W3mQrCode } from '@web3modal/react';


//WalletConnect Hooks to controll the UI status
import { useWeb3Modal } from '@web3modal/react';

//Wagami imports
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet, arbitrum, polygon, localhost} from 'wagmi/chains'


//Define which blockchains you want to connect
const chains = [mainnet, arbitrum, polygon,localhost];
//Your project id, apply one at https://cloud.walletconnect.com
const projectId = process.env.REACT_APP_PROJECT_ID;

//Wagmi client
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)

function App() {
  return (
    <div>
      <WagmiConfig config={wagmiConfig}>
        <HomePageExample1 />
      </WagmiConfig>

      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </div>
  )
}



function HomePageExample1() {

  return (<div className='homepage'>
    <Web3NetworkSwitch/>
    <Web3Button style={{
      marginTop: '20px'
    }}/>

    </div>
  );
}

function HomePageExample2() {
  const { open, close } = useWeb3Modal();

  return (<div className='homepage'>
      <Button variant="contained" color="primary"
        onClick={() => open()}>Wallet Connect
      </Button>
      </div>
  );
}

export default App;