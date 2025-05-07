import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { arbitrum, mainnet, polygon } from 'wagmi/chains'
import { useAccount, useDisconnect } from 'wagmi'

// 配置链和providers
const chains = [arbitrum, mainnet, polygon]
const projectId = 'YOUR_PROJECT_ID' // 需要替换为你的WalletConnect项目ID

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })])
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)

function Profile() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected)
    return (
      <div>
        已连接到: {address}
        <button onClick={() => disconnect()}>断开连接</button>
      </div>
    )
  return <div>请连接钱包</div>
}

export default function App() {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <Profile />
      </WagmiConfig>

      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
      />
    </>
  )
}