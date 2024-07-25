import { useState, useEffect, useRef } from 'react';
import './App.css';

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from 'ethers';

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import crowdFundABI from './contracts/CrowdFunding.json';
import projectABI from './contracts/Project.json';

// With this we can easily beautify our project, see more detail in https://bulma.io/
import 'bulma/css/bulma.min.css';

// This is where our logo is, you can change it if you want :D
const logo = 'https://raw.githubusercontent.com/rebase-network/Dapp-Learning/755c0937d305a4e38e1665b99ebbaaf0995b6981/DappLearning-logo.svg';

// We had set these variable names in .env, and we get them by import.meta.env   
const { VITE_INFURA_ID, VITE_PRIVATE_KEY, VITE_CONTRACT_ADDRESS } = import.meta.env;

// In here we init web3Provider with infura network and set wallet to connect it
// if you prefer Matamask use lines 24 , 25 to replace lines 26, 27   
//
// const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
// const wallet = web3Provider.getSigner();
const web3Provider = new ethers.InfuraProvider('sepolia', VITE_INFURA_ID);
const wallet = new ethers.Wallet(VITE_PRIVATE_KEY, web3Provider);
// Get instance of our crowdFund contract
const instance = new ethers.Contract(VITE_CONTRACT_ADDRESS, crowdFundABI?.abi, wallet);
// In this component let us make a form element easier
// save us from duplicate works   
// You can put any form element in children
function IptItem ({ label, children }) {
  return (
    <div className="field">
      <label className="label has-text-left	">{label}</label>
      <div className="control">{children}</div>
    </div>
  );
}

// The ProjectItem is the key component of showing
// it has two props:
// 1. data is from each fund project
// 2. onFund can calling the function that let you can make fund to your favour project
function ProjectItem ({ data, onFund }) {

  // These are the variable we need from data
  const { projectTitle, projectStarter, projectDesc, currentState, currentAmount, deadline, goalAmount } = data;

  // This can us get value from input element
  const fundEl = useRef(null);

  // As it shows, loading state
  const [loading, setLoading] = useState(false);

  // Depend on what currentState is there are three form:
  // 0 => Ongoing
  // 1 => Expired
  // 2 => Completed
  const resTag = () => {
    if (currentState === 0) {
      return <span className="tag is-info is-medium">Ongoing</span>;
    } else if (currentState === 2) {
      return <span className="tag is-primary is-medium">Completed</span>;
    } else {
      return <span className="tag is-medium">Expired</span>;
    }
  };

  // when this function has been called
  // the component will be in loading state until the fund had been accept
  // then set input to null value
  // finish loading state waiting for next calling
  const makeFund = async () => {
    setLoading(true);
    await onFund(fundEl.current.value);
    fundEl.current.value = null;
    setLoading(false);
  };

  return (
    <div className="card" style={{ marginBottom: '10px' }}>
      {/* This is for showing the basic info of project */}
      <div className="card-content">
        <div className="media">
          <div className="media-content">
            <p className="title is-4">
              <span style={{ marginRight: '10px' }}>{resTag()}</span>
              {projectTitle}
            </p>
            <p className="title is-5">{projectDesc}</p>
          </div>
        </div>
        {/* The fund button warper, make sure this button can be seen when currentState value is 0 */}
        {currentState === 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div className="field has-addons">
              <div className="control">
                <input className="input is-rounded" min={0} ref={fundEl} type="number" placeholder="Input your funds" />
              </div>
              <div className="control">
                <a className={`button is-primary ${loading ? 'is-loading' : ' '}`} onClick={makeFund}>
                  Fund
                </a>
              </div>
            </div>
          </div>
        )}
        <div className="content">
          {/* Here is where the current amount and goal amount is, 
              also when currentState is 2 it means the project is reached the goal,
              at this time current amount should be the same as goal amount so it can be hidden
           */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="has-text-weight-bold">{currentState !== 2 && `${ethers.formatEther(currentAmount)} ETH`}</span>
            <span className="has-text-weight-bold">{ethers.formatEther(goalAmount)} ETH</span>
          </div>
          {/* progress element makes the project fund progress more visualize */}
          <progress
            style={{ margin: '0 10px' }}
            className="progress is-success"
            value={currentState === 2 ? 100 : (ethers.formatEther(currentAmount) / ethers.formatEther(goalAmount)) * 100}
            max="100"
          ></progress>
        </div>
      </div>
    </div>
  );
}

function App () {

  // This is the main part of project, 
  // saving the all state we need :
  // loading is used when we start a new project
  // showModal decide when the modle should pop up
  // list saved all details of project
  // projectCon save each contract instance of project
  // projectInterval make sure the project list will properly update  
  // previousNum let us can check the previous project list length
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [list, setList] = useState([]);
  const [projectCon, setProjectCon] = useState([]);
  const [projectInterval, setProjectInterval] = useState();
  const [previousNum, setPreviousNum] = useState();

  // these variables have same purpose get and modify corresponding input element value
  const iptTitle = useRef(null);
  const iptDesc = useRef(null);
  const iptDur = useRef(null);
  const iptAmount = useRef(null);

  // calling getProjects function
  // this will only running once when project is init
  useEffect(() => {
    (async () => {
      let res = await web3Provider.getBlockNumber();
      await getProjects();
    })();
  }, []);

  // every time when projectCon had changed, this will be running automatically
  useEffect(() => {
    if (!projectCon) return;
    (async () => {
      // because of projectCon is only save the contract of each project
      // we also need use getDetails function to get detail ;)
      let res = await Promise.all(projectCon.map((e) => e.getDetails()));
      if (previousNum !== res.length) {
        clearInterval(projectInterval);
      }
      setPreviousNum(res.length);
      // save the deatails to list
      setList(res);
      if (projectCon.length === 0) return;
    })();
  }, [projectCon]);

  // decide when modal should be showed
  const switchModal = (isShow = false) => {
    !isShow && clearIpt();
    setShowModal(isShow);
  };

  // this will calling crowdFund to get all projects addresses
  // we can make returned addresses become contracts by use ethers.Contract
  // and save them to projectCon
  const getProjects = async () => {
    let arr = await instance.returnAllProjects();
    console.log('updating...', projectABI?.abi);
    setProjectCon(arr.map((e) => new ethers.Contract(e, projectABI?.abi, wallet)));
  };

  // clear all the input, the timing is when project start successfully
  const clearIpt = () => {
    [iptTitle, iptDesc, iptDur, iptAmount].map((e) => (e.current.value = null));
  };

  const startProject = async () => {
    try {

      // set confirm into loading state
      setLoading(true);

      // get title, description and duration value
      let res = [iptTitle, iptDesc, iptDur].map((e) => e.current.value);

      let amount;
      // check input value whether is our needed
      // if not make a alert and cease the function by throw a error
      if (!(typeof (res[2] * 1) === 'number' && res[2] * 1 > 0)) {
        alert('You have to input right duration');
        throw '';
      }
      if (typeof (iptAmount.current.value * 1) === 'number' && iptAmount.current.value * 1 > 0) {
        amount = ethers.parseEther(iptAmount.current.value);
      } else {
        alert('You have to input right amount');
        throw '';
      }

      // start the project, set a interval to update the list
      let re = await instance.startProject(...res, ethers.parseEther(iptAmount.current.value));
      clearInterval(projectInterval);
      setProjectInterval(setInterval(getProjects, 800));
      switchModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const makeFund = (contract, idx) => async (val) => {
    // we will calling a payable method of contract
    // thus we should set the value to declare how much fund we want supply
    let overrides = {
      value: ethers.parseEther(val),
    };

    // waiting for the transaction has been made
    let tx = await contract.contribute(overrides);

    // wait for contract creation transaction to be mined
    await tx.wait();

    // after that we can get updated details, and replace old one with it 
    let res = await contract.getDetails();
    setList(list.map((e, index) => (idx === index ? res : e)));
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <div>
        <button className="button is-primary" onClick={() => switchModal(true)}>
          START A PROJECT
        </button>
      </div>
      {/* show projects it will be a default project at first time */}
      <div style={{ textAlign: 'left', padding: '10px 20px', overflow: 'auto' }}>
        <span style={{ fontSize: '36px', fontWeight: 'bold' }}>Projects:</span>
        {list.map((e, idx) => (
          <ProjectItem data={e} key={idx} onFund={makeFund(projectCon[idx], idx)} />
        ))}
      </div>
      {/* this is modal, where user will input the info of the project they want to make */}
      <div className={`modal ${showModal ? 'is-active' : ' '}`}>
        <div className="modal-background"></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Start your project</p>
            <button className="delete" aria-label="close" onClick={() => switchModal()}></button>
          </header>
          <section className="modal-card-body">
            <div>
              <IptItem label="Title">
                <input className="input" ref={iptTitle} type="text" placeholder="input title" />
              </IptItem>
              <IptItem label="Description">
                <textarea className="textarea" ref={iptDesc} type="text" placeholder="input description" />
              </IptItem>
              <IptItem label="Amount Needed (ETH)">
                <input className="input" min={0} ref={iptAmount} type="number" placeholder="input" />
              </IptItem>
              <IptItem label="Duration (in days)">
                <input className="input" min={0} ref={iptDur} type="number" placeholder="input" />
              </IptItem>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button className={`button is-primary ${loading ? 'is-loading' : ' '}`} onClick={startProject}>
              Confirm
            </button>
            <button className="button" onClick={() => switchModal()}>
              Cancel
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
