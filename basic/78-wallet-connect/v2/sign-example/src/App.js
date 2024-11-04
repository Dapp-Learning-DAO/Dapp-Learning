import { Button } from "@material-ui/core";
import { useState, useEffect } from "react";
import Client from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import "./App.css";

// Initialize Web3Modal with WalletConnect Project ID
const projectId = process.env.REACT_APP_PROJECT_ID || "453f2a8e1d89bc35b8bc49eb781167b9";
const web3Modal = new Web3Modal({ projectId, walletConnectVersion: 2 });

function App() {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState("");

  useEffect(() => {
    if (!client) {
      createClient();
    }
  }, [client]);

  // Initialize the WalletConnect client
  const createClient = async () => {
    try {
      const newClient = await Client.init({
        projectId,
        relayUrl: "wss://relay.walletconnect.com",
      });
      setClient(newClient);
      subscribeToEvents(newClient);
    } catch (error) {
      console.error("Failed to create client:", error);
    }
  };

  // Connect to Wallet and create a session
  const handleConnect = async () => {
    if (!client) {
      console.error("Client not initialized");
      return;
    }
    try {
      const proposalNamespace = {
        eip155: {
          methods: ["eth_sendTransaction", "personal_sign"],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"],
        },
      };

      const { uri, approval } = await client.connect({
        requiredNamespaces: proposalNamespace,
      });

      if (uri) {
        web3Modal.openModal({ uri });
        const sessionNamespace = await approval();
        onSessionConnected(sessionNamespace);
        web3Modal.closeModal();
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  // Handle session confirmation
  const onSessionConnected = (sessionNamespace) => {
    setSession(sessionNamespace);
    setAccount(sessionNamespace.namespaces.eip155.accounts[0].slice(9));
  };

  // Disconnect session
  const handleDisconnect = async () => {
    if (!client || !session) return;
    try {
      await client.disconnect({
        topic: session.topic,
        message: "User disconnected",
        code: 6000,
      });
      reset();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  // Subscribe to WalletConnect events
  const subscribeToEvents = (client) => {
    client.on("session_ping", () => alert("Ping received"));
    client.on("session_event", (args) => console.log("Event received:", args));
    client.on("session_update", ({ topic, params }) => {
      console.log("Session updated:", params);
      const updatedSession = { ...client.session.get(topic), namespaces: params.namespaces };
      onSessionConnected(updatedSession);
    });
    client.on("session_delete", () => {
      console.log("Session deleted");
      reset();
    });
  };

  // Sign a message
  const handleSend = async () => {
    if (!account || !session) {
      console.error("No account or session found");
      return;
    }
    try {
      const message = "My email is john@doe.com - 1691813801271";
      const result = await client.request({
        topic: session.topic,
        chainId: "eip155:1",
        request: {
          method: "personal_sign",
          params: [message, account],
        },
      });
      alert("Signature: " + result);
    } catch (error) {
      console.error("Failed to sign:", error);
    }
  };

  // Reset session and account state
  const reset = () => {
    setAccount("");
    setSession(null);
  };

  return (
    <div className="App">
      <h1>WalletConnect Sign Demo</h1>
      {account ? (
        <>
          <p>Connected Account: {account}</p>
          <Button variant="contained" onClick={handleSend}>
            Personal Sign
          </Button>
          <Button variant="contained" color="secondary" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </>
      ) : (
        <Button variant="contained" onClick={handleConnect} disabled={!client}>
          Connect
        </Button>
      )}
    </div>
  );
}

export default App;
