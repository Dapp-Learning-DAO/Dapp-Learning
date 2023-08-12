import { Button } from "@material-ui/core";
import "./App.css";

import { useState, useEffect } from "react";
import Client from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";


const web3Modal = new Web3Modal({
  projectId: process.env.REACT_APP_PROJECT_ID,
  walletConnectVersion: 2
});


function App() {
  const [client, setClient] = useState();
  const [session, setSession] = useState([]);
  const [account, setAccount] = useState([]);

  /**
   * 1. Initialize a basic signing client , which is used to send messages.
   */
  async function createClient() {
    try {
      const newClient = await Client.init({
        projectId: process.env.REACT_APP_PROJECT_ID,
        relayUrl: "wss://relay.walletconnect.com",
      });
      setClient(newClient);
      await subscribeToEvents(newClient);
    } catch (e) {
      console.log(e);
    }
  }

  async function handleConnect() {
    /**
     * 2. Request to create a new session via sign client.
     */
    if (!client) throw Error("Client is not set");
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

      /**
       * 3. The session is created, display the session url in QRcode format via Web3Modal. 
       */
      if (uri) {
        web3Modal.openModal({ uri });

        /**
         * 4. Now wait for wallet side to confirm the connection.
         */
        const sessionNamespace = await approval();
        /**
         * 5. After the wallet accept the session, it will returns the wallet address it chooses.
         */
        console.log('wallet confirmed')
        console.log(sessionNamespace);
        onSessionConnected(sessionNamespace);
        web3Modal.closeModal();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function onSessionConnected(session) {
    try {
      setSession(session);
      setAccount(session.namespaces.eip155.accounts[0].slice(9));
    } catch (e) {
      console.log(e);
    }
  }

  async function handleDisconnect() {
    try {
      await client.disconnect({
        topic: session.topic,
        message: "User disconnected",
        code: 6000,
      });
      reset();
    } catch (e) {
      console.log(e);
    }
  }

  async function subscribeToEvents(client) {
    if (!client)
      throw Error("Unable to subscribe to events. Client does not exist.");
    try {
      client.on("session_ping", (args) => {
          alert('ping received');
      });

      client.on("session_event", (args) => {
        console.log("EVENT", "session_event", args);
      });

      client.on("session_update", ({ topic, params }) => {
        console.log("EVENT", "session_update", { topic, params });
        const { namespaces } = params;
        const _session = client.session.get(topic);
        const updatedSession = { ..._session, namespaces };
        onSessionConnected(updatedSession);
      });

      client.on("session_delete", () => {
        console.log("The user has disconnected the session from their wallet.");
        reset();
      });
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * 6. Since the session is online, now you can send message to the wallet to sign.
   */
  async function handleSend() {
    if (!account.length) throw Error("No account found");
    try {
      //args of personal_sign:https://docs.metamask.io/wallet/reference/personal_sign/
      const signParams = ["0x4d7920656d61696c206973206a6f686e40646f652e636f6d202d2031363931383133383031323731",account];

      console.log(signParams);

      const result = await client.request({
        topic: session.topic,
        chainId: "eip155:1",
        request: {
          method: "personal_sign",
          params: signParams,
        },
      });
      console.log("result is "+ result);
      alert('sign result '+ result);
    } catch (e) {
      console.log(e);
    }
  }

  const reset = () => {
    setAccount([]);
    setSession([]);
  };

  useEffect(() => {
    if (!client) {
      createClient();
    }
  }, [client]);

  return (
    <div className="App">
      <h1>Sign Demo</h1>
      {account.length ? (
        <>
          <p>{account}</p>
          <button onClick={handleSend}>Personal Sign</button>
          <button onClick={handleDisconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={handleConnect} disabled={!client}>
          Connect
        </button>
      )}
    </div>
  );
}


export default App;