import { useState, useEffect, useRef } from 'react';
import logo from './DappLearning-logo.svg';
import './App.css';
import { ethers } from 'ethers';
import crowdFundABI from './contracts/CrowdFunding.json';
import projectABI from './contracts/Project.json';
import 'bulma/css/bulma.min.css';

const { VITE_INFURA_ID, VITE_PRIVATE_KEY, VITE_CONTRACT_ADDRESS } = import.meta.env;

const web3Provider = new ethers.providers.InfuraProvider('rinkeby', VITE_INFURA_ID);
const wallet = new ethers.Wallet(VITE_PRIVATE_KEY, web3Provider);
// const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
// const wallet = web3Provider.getSigner();

const instance = new ethers.Contract(VITE_CONTRACT_ADDRESS, crowdFundABI.abi, wallet);

function IptItem({ label, children }) {
  return (
    <div className="field">
      <label className="label has-text-left	">{label}</label>
      <div className="control">{children}</div>
    </div>
  );
}

function ProjectItem({ data, onFund }) {
  const { projectTitle, projectStarter, projectDesc, currentState, currentAmount, deadline, goalAmount } = data;
  const fundEl = useRef(null);
  const [loading, setLoading] = useState(false);

  const resTag = () => {
    if (currentState === 0) {
      return <span className="tag is-info is-medium">Ongoing</span>;
    } else if (currentState === 2) {
      return <span className="tag is-primary is-medium">Completed</span>;
    } else {
      return <span className="tag is-medium">Expired</span>;
    }
  };

  const makeFund = async () => {
    setLoading(true);
    await onFund(fundEl.current.value);
    fundEl.current.value = null;
    setLoading(false);
    // onFund();
  };

  return (
    <div className="card" style={{ marginBottom: '10px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="has-text-weight-bold">{currentState !== 2 && `${ethers.utils.formatEther(currentAmount)} ETH`}</span>
            <span className="has-text-weight-bold">{ethers.utils.formatEther(goalAmount)} ETH</span>
          </div>
          <progress
            style={{ margin: '0 10px' }}
            className="progress is-success"
            value={currentState === 2 ? 100 : (ethers.utils.formatEther(currentAmount) / ethers.utils.formatEther(goalAmount)) * 100}
            max="100"
          ></progress>
          {/* <p>
            <time datetime="2016-1-1">11:09 PM - 1 Jan 2016</time>
          </p> */}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [list, setList] = useState([]);
  const [projectCon, setProjectCon] = useState([]);
  const [projectInterval, setProjectInterval] = useState();
  const [previousNum, setPreviousNum] = useState();

  const iptTitle = useRef(null);
  const iptDesc = useRef(null);
  const iptDur = useRef(null);
  const iptAmount = useRef(null);

  useEffect(() => {
    (async () => {
      let res = await web3Provider.getBlockNumber();
      await getProjects();
    })();
  }, []);

  useEffect(() => {
    if (!projectCon) return;
    (async () => {
      let res = await Promise.all(projectCon.map((e) => e.getDetails()));
      if (previousNum !== res.length) {
        clearInterval(projectInterval);
      }
      setPreviousNum(res.length);
      setList(res);
      if (projectCon.length === 0) return;
      // projectCon[2].on('FundingReceived', (contributor, amount, currentTotal, event) => {
      //   console.log('anyone');
      //   console.log(contributor);
      //   // "0x3455f15cc11F2E77c055f931A6C918ccc7c18fd8"

      //   console.log(amount);
      //   // "I like turtles."

      //   console.log(currentTotal);
      //   // "I like monkey."

      //   // See Event Emitter below for all properties on Event
      //   console.log(event);
      // });
    })();
  }, [projectCon]);

  const switchModal = (isShow = false) => {
    !isShow && clearIpt();
    setShowModal(isShow);
  };

  const getProjects = async () => {
    let arr = await instance.returnAllProjects();
    console.log('updating...');
    setProjectCon(arr.map((e) => new ethers.Contract(e, projectABI.abi, wallet)));
  };

  const clearIpt = () => {
    [iptTitle, iptDesc, iptDur, iptAmount].map((e) => (e.current.value = null));
  };

  const startProject = async () => {
    try {
      setLoading(true);
      let res = [iptTitle, iptDesc, iptDur].map((e) => e.current.value);
      let amount;
      if (!(typeof (res[2] * 1) === 'number' && res[2] * 1 > 0)) {
        alert('You have to input right duration');
        throw '';
      }
      if (typeof (iptAmount.current.value * 1) === 'number' && iptAmount.current.value * 1 > 0) {
        amount = ethers.utils.parseEther(iptAmount.current.value);
      } else {
        alert('You have to input right amount');
        throw '';
      }

      let re = await instance.startProject(...res, ethers.utils.parseEther(iptAmount.current.value));
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
    let overrides = {
      value: ethers.utils.parseEther(val),
    };
    let tx = await contract.contribute(overrides);
    let fund_res = await tx.wait();
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
      <div style={{ textAlign: 'left', padding: '10px 20px', overflow: 'auto' }}>
        <span style={{ fontSize: '36px', fontWeight: 'bold' }}>Projects:</span>
        {list.map((e, idx) => (
          <ProjectItem data={e} key={idx} onFund={makeFund(projectCon[idx], idx)} />
        ))}
      </div>
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
