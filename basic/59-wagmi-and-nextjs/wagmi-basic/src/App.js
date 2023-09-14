import Button from '@material-ui/core/Button';
import './App.css';
//wagmi dependencies
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
//view dependencies
import { localhost, polygon } from '@wagmi/chains'

/*Firstly we create the client calling to public JSON rpcs.
  You can refer to https://wagmi.sh/react/providers/configuring-chains
  Also keep in mind that publicClient is the http client connecting to public JSON-RPC endpoints while webSocketPublicClient 
  is websocket client.
*/
const { chains, publicClient, webSocketPublicClient ,} = configureChains(
  //more chains see https://www.npmjs.com/package/@wagmi/chains
  [polygon,localhost], 
  //providers are tried one by one to connect to above chains. more to see https://wagmi.sh/react/providers/configuring-chains
  //publicProvider will get the url from the preconfigured chains
  [publicProvider(), jsonRpcProvider({rpc: (chain) => ({http: 'https://localhost:8545',}),})]
)
 
/*Create wagmi config
*/
const config = createConfig({
  connectors:[
    new MetaMaskConnector({chains}), 
    // new WalletConnectConnector({
    //   chains,
    //   options: {
    //     projectId: '...',
    //   },
    // }),
    //See https://wagmi.sh/examples/connect-wallet for more
  ],
  publicClient, 
  webSocketPublicClient
})

function App() {
  return (
    <WagmiConfig config={config}>
        <Wallet />
    </WagmiConfig>
  )
}

const Wallet = ()=> {
  const { address, connector, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect()
  
  if (isConnected)
    return (
      <div className='profile'>
        <div>Connector:{connector.name}</div>
        <div>Current address:{address}</div>
        <div>
          <Button variant="outlined" color="primary" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </div>
    )
    return (<div className='profile'>
      {connectors.map((c) => (
        <Button style={{
          marginBottom: '20px'
        }} 
        variant="contained" color="primary" onClick={() => connect({connector:c})}>
        Connect {c.name}
        </Button>
      ))}

    </div>) 
    
}

export default App;