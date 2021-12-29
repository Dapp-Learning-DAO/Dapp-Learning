import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import { LinkOutlined } from "@ant-design/icons";
import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import "./App.css";
import { Row, Col, Button, Menu, Alert, Input, List, Card, Modal, InputNumber, Radio } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import { format } from "date-fns";
import {
  Header,
  Account,
  Faucet,
  Ramp,
  Contract,
  GasGauge,
  Address,
  ThemeSwitch,
  NoWalletDetected,
  Loading,
} from "./components";
import {
  useExchangePrice,
  useGasPrice,
  useUserProvider,
  useContractLoader,
  useContractReader,
  useEventListener,
  useBalance,
  useExternalContractLoader,
} from "./hooks";
import { Transactor } from "./helpers";
import { parseEther } from "@ethersproject/units";
import { constants } from "ethers";
import { INFURA_ID, DAI_ADDRESS, DAI_ABI, NETWORK, NETWORKS } from "./constants";
import { parseUnits } from "@ethersproject/units";
import { hexlify } from "@ethersproject/bytes";
import StackGrid from "react-stack-grid";
import ReactJson from "react-json-view";
import assets from "./assets.js";
import assetsAuctionStat from "./assetsAuctionStat.js";

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "localhost", port: "5001", protocol: "http" });

console.log("📦 Assets:========== ", assets);

const assetsInitAuctionStat = {};
for (let a in assetsAuctionStat) {
  assetsInitAuctionStat[assetsAuctionStat[a]] = {};
  assetsInitAuctionStat[assetsAuctionStat[a]].forSale = true;
  assetsInitAuctionStat[assetsAuctionStat[a]].forAuction = false;
  assetsInitAuctionStat[assetsAuctionStat[a]].assetAuctionType = "1";
}

const allUserCollections = {};
const usersBid = {};
// let networkError;

console.log("Hello , I'm  assetsInitAuctionStat");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS["localhost"]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;

//EXAMPLE STARTING JSON:
const STARTING_JSON = {
  description: "It's actually a bison?",
  external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
  image: "https://austingriffith.com/images/paintings/buffalo.jpg",
  name: "Buffalo",
  attributes: [
    {
      trait_type: "BackgroundColor",
      value: "green",
    },
    {
      trait_type: "Eyes",
      value: "googly",
    },
  ],
};

const WalletCheck = {
  walletExist: false,
  approvePermission: {},
  connecting: false,
};

//helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path);
    if (!file.content) continue;
    const content = new BufferList();
    for await (const chunk of file.content) {
      content.append(chunk);
    }
    console.log(content);
    return content;
  }
};

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = new StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544");
const mainnetInfura = new StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new StaticJsonRpcProvider(localProviderUrl);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

function App(props) {
  if (window.ethereum) {
    WalletCheck.walletExist = true;
  }

  let [permissionApproved] = useState(false);

  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  //const _provider = new ethers.providers.Web3Provider(window.ethereum)
  const [injectedProvider, setInjectedProvider] = useState();

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);
  if (!allUserCollections[address]) {
    allUserCollections[address] = [];
  }

  if (!usersBid[address]) {
    usersBid[address] = {};
  }

  if (!WalletCheck.approvePermission[address]) {
    WalletCheck.approvePermission[address] = false;
  } else {
    permissionApproved = WalletCheck.approvePermission[address];
  }

  // You can warn the user if you would like them to be on a specific network
  let localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  let selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;
  console.log("user provider network", userProvider._network);

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transacti ons and provides notificiations
  const tx = Transactor(userProvider, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  // const faucetTx = Transactor(localProvider, gasPrice);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(writeContracts, address, localProvider);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI);

  if (DEBUG) console.log("🌍 DAI contract on mainnet:", mainnetDAIContract);
  //
  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader({ DAI: mainnetDAIContract }, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);
  if (DEBUG) console.log("🥇 myMainnetDAIBalance:", myMainnetDAIBalance);

  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "MYERC721", "balanceOf", [address]);
  if (DEBUG) console.log("🤗 balance:", balance);

  //📟 Listen for broadcast events
  const transferEvents = useEventListener(readContracts, "MYERC721", "Transfer", localProvider, 1);
  if (DEBUG) console.log("📟 Transfer events:", transferEvents);

  const [modalVisible, setModalVisible] = useState(false);
  const [auctionDetails, setAuctionDetails] = useState({ price: "", duration: "" });
  const [auctionToken, setAuctionToken] = useState("");

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const [yourCollectibles, setYourCollectibles] = useState(assetsInitAuctionStat);

  let [userCollections, setUserCollections] = useState([]);
  if (allUserCollections[address]) {
    userCollections = [...allUserCollections[address]];
  }

  // useEffect(()=>{
  //   const updateYourCollectibles = async () => {
  //     let collectibleUpdate = []
  //     for(let tokenIndex=0;tokenIndex<balance;tokenIndex++){
  //       try{
  //         console.log("GEtting token index",tokenIndex)
  //         const tokenId = await readContracts.YourCollectible.tokenOfOwnerByIndex(address, tokenIndex)
  //         console.log("tokenId",tokenId)
  //         const tokenURI = await readContracts.YourCollectible.tokenURI(tokenId)
  //         console.log("tokenURI",tokenURI)
  //
  //         const ipfsHash =  tokenURI.replace("https://ipfs.io/ipfs/","")
  //         console.log("ipfsHash",ipfsHash)
  //
  //         const jsonManifestBuffer = await getFromIPFS(ipfsHash)
  //
  //         try{
  //           const jsonManifest = JSON.parse(jsonManifestBuffer.toString())
  //           // console.log("jsonManifest",jsonManifest)
  //           collectibleUpdate.push({ id:tokenId, uri:tokenURI, owner: address, ...jsonManifest })
  //         }catch(e){console.log(e)}
  //
  //       }catch(e){console.log(e)}
  //     }
  //     setYourCollectibles(collectibleUpdate)
  //   }
  //   updateYourCollectibles()
  // },[ address, yourBalance ])

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      readContracts &&
      writeContracts &&
      mainnetDAIContract
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? yourLocalBalance : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetDAIContract);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [mainnetProvider, address, selectedChainId, yourLocalBalance, readContracts, writeContracts, mainnetDAIContract]);

  let networkDisplay = "";
  if (localChainId && selectedChainId && localChainId != selectedChainId) {
    networkDisplay = (
      <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
        <Alert
          message={"⚠️ Wrong Network"}
          description={
            <div>
              You have <b>{NETWORK(selectedChainId) ? NETWORK(selectedChainId).name : "unknow network"}</b> selected and
              you need to be on <b>{NETWORK(localChainId).name}</b>.
            </div>
          }
          type="error"
          closable={false}
        />
      </div>
    );
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    console.log("loadWeb3Modal", web3Modal, web3Modal.cachedProvider);
    const provider = await web3Modal.connect();
    console.log(provider);
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name === "localhost";

  const grabFounds = async () => {
    let currentSupply = parseInt(await readContracts.SimpleToken.balanceOf(address));
    console.log("Total balance of erc20 with current address is", currentSupply);
    if (currentSupply < 1000) {
      await tx(readContracts.SimpleToken.mint(address, 1000));
    }
    currentSupply = await readContracts.SimpleToken.balanceOf(address);
    console.log("Total balance of erc20 with current address is", currentSupply);
  };

  console.log("For grabFounds");
  console.log("Your local Balance");
  console.log(yourLocalBalance);
  faucetHint = (
    <div style={{ padding: 16, position: "fixed", textAlign: "right", right: 0, top: 40 }}>
      <Button
        type={"primary"}
        onClick={() => {
          grabFounds();
        }}
      >
        💰 Grab funds from the faucet when balance less than 1000 ⛽️
      </Button>
    </div>
  );

  const [yourJSON, setYourJSON] = useState(STARTING_JSON);
  const [sending, setSending] = useState();
  const [ipfsHash, setIpfsHash] = useState();
  const [ipfsDownHash, setIpfsDownHash] = useState();

  const [downloading, setDownloading] = useState();
  const [ipfsContent, setIpfsContent] = useState();
  let [yourBid, setYourBid] = useState(usersBid[address]);
  if (usersBid[address]) {
    yourBid = usersBid[address];
  }

  const [transferToAddresses, setTransferToAddresses] = useState({});

  const [loadedAssets, setLoadedAssets] = useState();

  const [url2TokenID, setUrl2TokenID] = useState({});

  const [auctionType, setAuctionType] = useState(1);

  let [Hover, setHover] = useState(false);

  const updateYourCollectibles = async () => {
    let assetUpdate = [];
    for (let a in assets) {
      try {
        const forSale = yourCollectibles[a].forSale;
        let owner;
        let auctionInfo = {
          seller: "",
          price: 0,
          duration: 0,
          tokenAddress: 0,
          maxBid: 0,
          maxBidUser: 0,
          isActive: false,
          bidAmounts: [],
          users: [],
        };
        if (!forSale) {
          const tokenId = url2TokenID[a];
          owner = await readContracts.MYERC721.ownerOf(tokenId);
          const nftAddress = readContracts.MYERC721.address;
          console.log("yourCollectibles[a]");
          console.log(yourCollectibles[a]);
          if (yourCollectibles[a].forAuction) {
            if (yourCollectibles[a].assetAuctionType === 1) {
              auctionInfo = await readContracts.AuctionUnfixedPrice.getTokenAuctionDetails(nftAddress, tokenId);
            } else {
              auctionInfo = await readContracts.AuctionFixedPrice.getTokenAuctionDetails(nftAddress, tokenId);
            }
          }
          console.log("========== forSale is false");
          console.log(auctionInfo);
        }
        assetUpdate.push({ id: a, ...assets[a], forSale: forSale, owner: owner, auctionInfo });
      } catch (e) {
        console.log(e);
      }
    }
    setLoadedAssets(assetUpdate);
  };

  useEffect(() => {
    if (readContracts && yourCollectibles) updateYourCollectibles();
  }, [assets, readContracts, transferEvents, yourCollectibles]);

  const startAuction = tokenUri => {
    return async () => {
      if (!injectedProvider) {
        await loadWeb3Modal();
      }
      if (!WalletCheck.approvePermission[address]) {
        await connectWallet();
      }
      setAuctionToken(tokenUri);
      setModalVisible(true);
      setAuctionType(1);
    };
  };

  const placeBid = async (tokenUri, bidPrice, BidType) => {
    console.log("In placeBid , the tokenUri is ", tokenUri);
    const tokenId = url2TokenID[tokenUri];
    const nftAddress = readContracts.MYERC721.address;

    try {
      if (BidType === 1) {
        console.log("Going to bid when auctionType is 1");
        await tx(writeContracts.AuctionUnfixedPrice.bid(nftAddress, tokenId, bidPrice));
      } else {
        console.log("Going to bid when auctionType is 2");
        await tx(writeContracts.AuctionFixedPrice.purchaseNFTToken(nftAddress, tokenId));
        assetsInitAuctionStat[auctionToken].forAuction = false;
        delete yourBid[tokenUri];
        userCollections.push(tokenUri);
        allUserCollections[address] = userCollections;
        setUserCollections(userCollections);
        setYourCollectibles(assetsInitAuctionStat);
      }
      usersBid[address] = yourBid;
      updateYourCollectibles();
    } catch (e) {
      console.log("Failed to placeBid");
      console.log(e);
    }
  };

  const completeAuction = tokenUri => {
    return async () => {
      const tokenId = url2TokenID[tokenUri];
      const nftAddress = readContracts.MYERC721.address;
      const auctionInfo = await readContracts.AuctionUnfixedPrice.getTokenAuctionDetails(nftAddress, tokenId);
      const maxBidUser = auctionInfo.maxBidUser;
      console.log("When complete Auction, maxBid User is ", maxBidUser);
      try {
        await tx(writeContracts.AuctionUnfixedPrice.executeSale(nftAddress, tokenId));
        if (maxBidUser === address) {
          userCollections.push(tokenUri);
          allUserCollections[address] = userCollections;
        } else {
          allUserCollections[maxBidUser].push(tokenUri);
        }
        assetsInitAuctionStat[tokenUri].forAuction = false;
        setYourCollectibles(assetsInitAuctionStat);
        updateYourCollectibles();
      } catch (e) {
        console.log("Failed to complete Auction");
        console.log(e);
      }
    };
  };

  const cancelAuction = (tokenUri, auctionType) => {
    return async () => {
      const tokenId = url2TokenID[tokenUri];
      const nftAddress = readContracts.MYERC721.address;
      if (auctionType === 1) {
        await tx(writeContracts.AuctionUnfixedPrice.cancelAution(nftAddress, tokenId));
      } else {
        await tx(writeContracts.AuctionFixedPrice.cancelAution(nftAddress, tokenId));
      }

      assetsInitAuctionStat[tokenUri].forAuction = false;
      userCollections.push(tokenUri);
      allUserCollections[address] = userCollections;
      setUserCollections(userCollections);
      setYourCollectibles(assetsInitAuctionStat);
      updateYourCollectibles();
    };
  };

  const mintItem = async tokenUri => {
    if (!injectedProvider) {
      await loadWeb3Modal();
    }
    if (!WalletCheck.approvePermission[address]) {
      await connectWallet();
    }
    await readContracts.MYERC721.mintWithTokenURI(address, tokenUri);
    const tokenId = (await readContracts.MYERC721.totalSupply()) - 1;

    url2TokenID[tokenUri] = tokenId;
    assetsInitAuctionStat[tokenUri].forSale = false;

    userCollections.push(tokenUri);
    allUserCollections[address] = userCollections;
    setUserCollections(userCollections);
    setYourCollectibles(assetsInitAuctionStat);
    updateYourCollectibles();
  };

  let galleryList = [];
  for (let a in loadedAssets ? loadedAssets.slice(0, 6) : []) {
    // console.log("loadedAssets",a,loadedAssets[a])

    let cardActions = [];
    let auctionDetails = [];
    if (loadedAssets[a].forSale) {
      cardActions.push(
        <div>
          <Button
            onClick={() => {
              mintItem(loadedAssets[a].id);
            }}
          >
            Mint
          </Button>
        </div>,
      );
      auctionDetails.push(null);
    } else {
      const { auctionInfo } = loadedAssets[a];
      console.log("auctionInfo duration is ", auctionInfo.duration);
      const deadline = parseInt(auctionInfo.duration * 1000);
      console.log("Deadline is ", deadline);
      console.log("current Time is ", new Date().getTime());
      const isEnded = deadline * 1000 <= new Date().getTime();

      console.log("======auctionInfo");
      console.log(auctionInfo);
      console.log("In auction, the value of assetsInitAuctionStat[a] is");
      console.log(assetsInitAuctionStat[a]);
      console.log(a);
      const auctionTypeInner = loadedAssets[a].id;
      cardActions.push(
        <div>
          <div>
            owned by:{" "}
            <Address
              address={loadedAssets[a].owner}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              minimized={true}
            />
          </div>
          {!loadedAssets[a].auctionInfo.isActive && address === loadedAssets[a].owner && (
            <>
              <Button
                style={{ marginBottom: "10px" }}
                onClick={startAuction(loadedAssets[a].id)}
                disabled={address !== loadedAssets[a].owner}
              >
                Start auction
              </Button>
              <br />
            </>
          )}
          {loadedAssets[a].auctionInfo.isActive &&
            address === loadedAssets[a].auctionInfo.seller &&
            assetsInitAuctionStat[auctionTypeInner].assetAuctionType === 1 && (
              <>
                <Button style={{ marginBottom: "10px" }} onClick={completeAuction(loadedAssets[a].id)}>
                  Complete auction
                </Button>
                <br />
              </>
            )}
          {loadedAssets[a].auctionInfo.isActive && address === loadedAssets[a].auctionInfo.seller && (
            <>
              <Button
                style={{ marginBottom: "10px" }}
                onClick={cancelAuction(loadedAssets[a].id, assetsInitAuctionStat[auctionTypeInner].assetAuctionType)}
              >
                Cancel auction
              </Button>
              <br />
            </>
          )}
        </div>,
      );

      console.log("Loaded asset is : ", loadedAssets[a]);
      console.log("Your Bid is ", yourBid[loadedAssets[a].id]);
      console.log("Whether is ended: ", isEnded);
      auctionDetails.push(
        auctionInfo.isActive ? (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontWeight: "bold" }}>
              {assetsInitAuctionStat[auctionTypeInner].assetAuctionType === 1 ? "Unfixed Price " : "Fixed Price "}
              Auction is in progress
            </p>
            <p style={{ margin: 0, marginBottom: "2px" }}>
              {assetsInitAuctionStat[auctionTypeInner].assetAuctionType === 1 ? "Minimal " : ""} price is{" "}
              {auctionInfo.price.toString()}{" "}
            </p>
            <p style={{ marginTop: 0 }}>
              {!isEnded
                ? `Auction ends at ${format(new Date(deadline), "MMMM dd, hh:mm:ss")}`
                : "Auction has already ended"}
            </p>
            {assetsInitAuctionStat[auctionTypeInner].assetAuctionType === 1 && (
              <div>
                {auctionInfo.maxBidUser === constants.AddressZero ? (
                  "Highest bid was not made yet"
                ) : (
                  <div>
                    Highest bid by:{" "}
                    <Address
                      address={auctionInfo.maxBidUser}
                      ensProvider={mainnetProvider}
                      blockExplorer={blockExplorer}
                      minimized={true}
                    />
                    <p> is {auctionInfo.maxBid.toString()}</p>
                  </div>
                )}
              </div>
            )}

            {assetsInitAuctionStat[auctionTypeInner].assetAuctionType === 2 && (
              <div>
                <div>
                  Fixed Price for this product is : <p>{auctionInfo.price.toString()}</p>
                </div>
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", marginTop: "20px" }}>
                <p style={{ margin: 0, marginRight: "15px" }}>Your bid in ERC20: </p>
                <InputNumber
                  placeholder="0.1"
                  value={yourBid[loadedAssets[a].id]}
                  onChange={newBid => {
                    usersBid[address] = { ...yourBid, [loadedAssets[a].id]: newBid };
                    setYourBid({ ...yourBid, [loadedAssets[a].id]: newBid });
                  }}
                  style={{ flexGrow: 1 }}
                />
              </div>
              <Button
                style={{ marginTop: "7px" }}
                onClick={() =>
                  placeBid(
                    loadedAssets[a].id,
                    yourBid[loadedAssets[a].id],
                    assetsInitAuctionStat[auctionTypeInner].assetAuctionType,
                  )
                }
                disabled={!yourBid[loadedAssets[a].id] || isEnded}
              >
                Place a bid
              </Button>
            </div>
          </div>
        ) : null,
      );
    }

    galleryList.push(
      <>
        <Card
          style={{ width: 300 }}
          key={loadedAssets[a].name}
          actions={cardActions}
          title={
            <div>
              {loadedAssets[a].name}{" "}
              <a
                style={{ cursor: "pointer", opacity: 0.33 }}
                href={loadedAssets[a].external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkOutlined />
              </a>
            </div>
          }
        >
          <img style={{ maxWidth: 130 }} src={loadedAssets[a].image} />
          <div style={{ opacity: 0.77 }}>{loadedAssets[a].description}</div>
          {auctionDetails}
        </Card>
      </>,
    );
  }

  const handleOk = async () => {
    setModalVisible(false);
    const { price, duration } = auctionDetails;
    const tokenId = url2TokenID[auctionToken];
    const nftAddress = readContracts.MYERC721.address;
    const erc20Address = readContracts.SimpleToken.address;
    console.log("Token URL is ", auctionToken);
    console.log("duration is ", duration);

    let writeAuction;

    if (auctionType === 1) {
      writeAuction = writeContracts.AuctionUnfixedPrice;
      assetsInitAuctionStat[auctionToken].assetAuctionType = 1;
    } else {
      writeAuction = writeContracts.AuctionFixedPrice;
      assetsInitAuctionStat[auctionToken].assetAuctionType = 2;
    }

    console.log("==========after 721 approve");

    const erc20Price = parseInt(price.toString());
    console.log("ERC20 Price for Auction is", erc20Price);
    const blockDuration = Math.floor(new Date().getTime() / 1000) + duration;
    console.log("blockDuration is", blockDuration);

    await tx(writeAuction.createTokenAuction(nftAddress, tokenId, erc20Address, erc20Price, blockDuration));

    assetsInitAuctionStat[auctionToken].forAuction = true;
    console.log("auctionToken in handleOk is ", auctionToken);
    console.log("userCollections before delete", userCollections);
    const index = userCollections.indexOf(auctionToken);
    userCollections.splice(index, 1);
    console.log("userCollections after delete", userCollections);
    allUserCollections[address] = userCollections;
    setUserCollections(userCollections);
    setYourCollectibles(assetsInitAuctionStat);
    updateYourCollectibles();
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleAuctionType = e => {
    setAuctionType(e.target.value);
  };

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
  };

  window.ethereum && window.ethereum.on("chainChanged", chainId => {});

  window.ethereum &&
    window.ethereum.on("accountsChanged", accounts => {
      loadWeb3Modal();
    });

  // const dismissNetworkError = async () => {
  //   networkError = undefined;
  //   loadWeb3Modal();
  // };

  const connectWallet = async () => {
    const ethBalance = await localProvider.getBalance(address);
    if (ethBalance <= 0.3) {
      const signer = localProvider.getSigner();
      let result = await signer.sendTransaction({
        to: address,
        value: parseEther("0.3"),
        gasPrice: parseUnits("4.1", "gwei"),
        gasLimit: hexlify(120000),
      });
      console.log("Trans ETH result: ", result);
    }

    WalletCheck.connecting = true;
    await tx(writeContracts.MYERC721.setApprovalForAll(writeContracts.AuctionFixedPrice.address, true));
    await tx(writeContracts.MYERC721.setApprovalForAll(writeContracts.AuctionUnfixedPrice.address, true));
    await tx(writeContracts.SimpleToken.approve(writeContracts.AuctionFixedPrice.address, 10000));
    await tx(writeContracts.SimpleToken.approve(writeContracts.AuctionUnfixedPrice.address, 10000));

    WalletCheck.approvePermission[address] = true;
    WalletCheck.connecting = false;
  };

  const toggleHover = async () => {
    console.log("toggleHover");
    setHover(!Hover);
  };

  return (
    <div className="App">
      {!WalletCheck.walletExist && <NoWalletDetected />}
      {/*{!WalletCheck.approvePermission[address]  && <ConnectWallet
      connectWallet={() => connectWallet()}
      networkError={networkError}
      dismiss={() => dismissNetworkError()} />}*/}
      {WalletCheck.connecting && <Loading />}

      {WalletCheck.walletExist && (
        <div>
          <Modal
            title="Start auction"
            visible={modalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            okButtonProps={{ disabled: !auctionDetails.price || !auctionDetails.duration }}
            okText="Start"
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <p style={{ margin: 0, marginRight: "15px" }}>ERC20 Price (minimal bid): </p>
              <InputNumber
                placeholder="0.1"
                value={auctionDetails.price}
                onChange={newPrice => setAuctionDetails({ ...auctionDetails, price: newPrice })}
                style={{ flexGrow: 1 }}
              />
            </div>
            <br />
            <div style={{ display: "flex", alignItems: "center" }}>
              <p style={{ margin: 0, marginRight: "15px" }}>Duration in seconds: </p>
              <InputNumber
                placeholder="3600"
                value={auctionDetails.duration}
                onChange={newDuration => setAuctionDetails({ ...auctionDetails, duration: newDuration })}
                style={{ flexGrow: 1 }}
              />
            </div>
            <br />
            <div style={{ display: "flex", alignItems: "center" }}>
              <Radio.Group onChange={handleAuctionType} value={auctionType}>
                <Radio value={1}>Unfixed Price Auction</Radio>
                <Radio value={2}>Fixed Price Auction</Radio>
              </Radio.Group>
            </div>
          </Modal>

          {/* ✏️ Edit the header and change the title to your project name */}
          <Header />
          {networkDisplay}

          <BrowserRouter>
            <Menu style={{ textAlign: "center", alignItems: "center" }} selectedKeys={route} mode="horizontal">
              <Menu.Item key="/">
                <Link
                  onClick={() => {
                    setRoute("/");
                  }}
                  to="/"
                >
                  Gallery
                </Link>
              </Menu.Item>
              <Menu.Item key="/yourcollectibles">
                <Link
                  onClick={() => {
                    setRoute("/yourcollectibles");
                  }}
                  to="/yourcollectibles"
                >
                  YourCollectibles
                </Link>
              </Menu.Item>
              <Menu.Item key="/transfers">
                <Link
                  onClick={() => {
                    setRoute("/transfers");
                  }}
                  to="/transfers"
                >
                  Transfers
                </Link>
              </Menu.Item>
              <Menu.Item key="/ipfsup">
                <Link
                  onClick={() => {
                    setRoute("/ipfsup");
                  }}
                  to="/ipfsup"
                >
                  IPFS Upload
                </Link>
              </Menu.Item>
              <Menu.Item key="/ipfsdown">
                <Link
                  onClick={() => {
                    setRoute("/ipfsdown");
                  }}
                  to="/ipfsdown"
                >
                  IPFS Download
                </Link>
              </Menu.Item>
              <Menu.Item key="/debugcontracts">
                <Link
                  onClick={() => {
                    setRoute("/debugcontracts");
                  }}
                  to="/debugcontracts"
                >
                  Debug Contracts
                </Link>
              </Menu.Item>
            </Menu>

            <Switch>
              <Route exact path="/">
                {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

                <div style={{ maxWidth: 1024, margin: "auto", marginTop: 32, paddingBottom: 56 }}>
                  <Button
                    disabled={galleryList.length === 0}
                    onClick={updateYourCollectibles}
                    style={{ marginBottom: "25px" }}
                  >
                    Update collectibles
                  </Button>

                  <StackGrid columnWidth={300} gutterWidth={16} gutterHeight={16}>
                    {galleryList}
                  </StackGrid>
                </div>
              </Route>

              <Route path="/yourcollectibles">
                <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
                  <List
                    bordered
                    dataSource={userCollections}
                    renderItem={item => {
                      return (
                        <List.Item key={assets[item].external_url + "_" + address}>
                          <Card title={<div>{assets[item].name}</div>}>
                            <div>
                              <img src={assets[item].image} style={{ maxWidth: 150 }} />
                            </div>
                            <div>{assets[item].description}</div>
                          </Card>
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </Route>

              <Route path="/transfers">
                <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
                  <List
                    bordered
                    dataSource={transferEvents}
                    renderItem={item => {
                      return (
                        <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber + "_" + item[2].toNumber()}>
                          <span style={{ fontSize: 16, marginRight: 8 }}>#{item[2].toNumber()}</span>
                          <Address address={item[0]} ensProvider={mainnetProvider} fontSize={16} />
                          <Address address={item[1]} ensProvider={mainnetProvider} fontSize={16} />
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </Route>

              <Route path="/ipfsup">
                <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
                  <ReactJson
                    style={{ padding: 8 }}
                    src={yourJSON}
                    theme={"pop"}
                    enableClipboard={false}
                    onEdit={(edit, a) => {
                      setYourJSON(edit.updated_src);
                    }}
                    onAdd={(add, a) => {
                      setYourJSON(add.updated_src);
                    }}
                    onDelete={(del, a) => {
                      setYourJSON(del.updated_src);
                    }}
                  />
                </div>

                <Button
                  style={{ margin: 8 }}
                  loading={sending}
                  size="large"
                  shape="round"
                  type="primary"
                  onClick={async () => {
                    console.log("UPLOADING...", yourJSON);
                    setSending(true);
                    setIpfsHash();
                    const result = await ipfs.add(JSON.stringify(yourJSON)); //addToIPFS(JSON.stringify(yourJSON))
                    if (result && result.path) {
                      setIpfsHash(result.path);
                    }
                    setSending(false);
                    console.log("RESULT:", result);
                  }}
                >
                  Upload to IPFS
                </Button>

                <div style={{ padding: 16, paddingBottom: 150 }}>{ipfsHash}</div>
              </Route>
              <Route path="/ipfsdown">
                <div style={{ paddingTop: 32, width: 740, margin: "auto" }}>
                  <Input
                    value={ipfsDownHash}
                    placeHolder={"IPFS hash (like QmadqNw8zkdrrwdtPFK1pLi8PPxmkQ4pDJXY8ozHtz6tZq)"}
                    onChange={e => {
                      setIpfsDownHash(e.target.value);
                    }}
                  />
                </div>
                <Button
                  style={{ margin: 8 }}
                  loading={sending}
                  size="large"
                  shape="round"
                  type="primary"
                  onClick={async () => {
                    console.log("DOWNLOADING...", ipfsDownHash);
                    setDownloading(true);
                    setIpfsContent();
                    const result = await getFromIPFS(ipfsDownHash); //addToIPFS(JSON.stringify(yourJSON))
                    if (result && result.toString) {
                      setIpfsContent(result.toString());
                    }
                    setDownloading(false);
                  }}
                >
                  Download from IPFS
                </Button>

                <pre style={{ padding: 16, width: 500, margin: "auto", paddingBottom: 150 }}>{ipfsContent}</pre>
              </Route>
              <Route path="/debugcontracts">
                <Contract
                  name="AuctionFixedPrice"
                  signer={userProvider.getSigner()}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />
                <Contract
                  name="AuctionUnfixedPrice"
                  signer={userProvider.getSigner()}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />
              </Route>
            </Switch>
          </BrowserRouter>

          <ThemeSwitch />

          {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
          <div
            style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}
            onMouseEnter={toggleHover}
            onMouseLeave={toggleHover}
          >
            <Account
              address={address}
              localProvider={localProvider}
              userProvider={userProvider}
              mainnetProvider={mainnetProvider}
              price={yourLocalBalance}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
            {Hover && faucetHint}
          </div>

          {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
          <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
            <Row align="middle" gutter={[4, 4]}>
              <Col span={8}>
                <Ramp price={price} address={address} networks={NETWORKS} />
              </Col>

              <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
                <GasGauge gasPrice={gasPrice} />
              </Col>
              <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
                <Button
                  onClick={() => {
                    window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
                  }}
                  size="large"
                  shape="round"
                >
                  <span style={{ marginRight: 8 }} role="img" aria-label="support">
                    💬
                  </span>
                  Support
                </Button>
              </Col>
            </Row>

            <Row align="middle" gutter={[4, 4]}>
              <Col span={24}>
                {
                  /*  if the local provider has a signer, let's show the faucet:  */
                  faucetAvailable ? (
                    <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
                  ) : (
                    ""
                  )
                }
              </Col>
            </Row>
          </div>
        </div>
      )}
    </div>
  );
}

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

export default App;
