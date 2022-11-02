import Link from 'next/link';
import { Container, Main, Title, Description, SwapBox, TokenList, RainbowButton } from '../components/sharedstyles';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { ChangeEvent, MouseEventHandler, useEffect, useRef, useState } from 'react';
import { usePrepareContractWrite, useContractWrite, useContractRead, useAccount } from 'wagmi';
import { toast, Id } from 'react-toastify';
import { BigNumber, constants } from 'ethers';
import { router2ContractConfig, wethContractConfig, uniContractConfig } from '../config/contractsConfig';
import { formatEther, parseEther } from 'ethers/lib/utils';
import 'react-toastify/dist/ReactToastify.css';

const expiredTime = Number(new Date()) + 60 * 60 * 10

const tokens = [
  { name: 'WETH', config: wethContractConfig },
  { name: 'Uni', config: uniContractConfig },
];
export default function Swap() {
  const [inputIndex, setInputIndex] = useState(0);
  const [outputIndex, setOutputIndex] = useState(1);
  const [inputAmount, setInputAmount] = useState<BigNumber>(BigNumber.from("0"));
  const [outputAmount, setOutputAmount] = useState<BigNumber>(BigNumber.from("0"));

  const { isLoading: getAmountsOutLoading, refetch: getAmountsOutRefetch } = useContractRead({
    // fetch router2.getAmountsOut get output amount
    // function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts);
    ...router2ContractConfig,
    functionName: "getAmountsOut",
    args: [
      inputAmount,
      [
        tokens[inputIndex].config.address,
        tokens[outputIndex].config.address,
      ]
    ],
    // trigger condition: input and output are different token && inputAmount > 0
    enabled: inputIndex !== outputIndex && inputAmount.gt(BigNumber.from("0")),
    onSuccess(data: BigNumber[]) {
      if (data && data[1]) setOutputAmount(data[1])
    },
    onError(err) {
      toast.error(JSON.stringify(err))
    }
  });


  // get user address from wagmi hook useAccount
  const { address, isConnected } = useAccount();
  const [isApproved, setIsApproved] = useState(false);

  const { isLoading: allowanceLoading, refetch: allowanceRefetch } = useContractRead({
    // fetch outputToken.allowance
    // function allowance(address account, address spender) public view returns (uint);
    address: tokens[inputIndex].config.address,
    abi: tokens[inputIndex].config.abi,
    functionName: "allowance",
    enabled: isConnected,
    args: [address, router2ContractConfig.address],
    onSuccess(data: BigNumber) {
      if (data.gt(BigNumber.from("0"))) {
        setIsApproved(data.gte(outputAmount))
      } else {
        setIsApproved(false);
      }
    },
    onError(err) {
      toast.error(JSON.stringify(err))
    }
  });

  // fetch getAmountsOut when select index or input amount changed
  useEffect(() => {
    if (!getAmountsOutLoading && inputIndex !== outputIndex && inputAmount.gt(BigNumber.from("0"))) {
      getAmountsOutRefetch()
      allowanceRefetch()
    }
  }, [inputIndex, inputAmount])

  const toastId = useRef<Id | null>(null);
  // addRecentTransaction will add tx hash in rainbowkit when send transcation
  const addRecentTransaction = useAddRecentTransaction();

  const { config: approveConfig } = usePrepareContractWrite({
    address: tokens[inputIndex].config.address,
    abi: tokens[inputIndex].config.abi,
    enabled: isConnected,
    functionName: "approve",
    args: [
      router2ContractConfig.address,
      constants.MaxUint256
    ],
    onError(err: any) {
      toast.error(JSON.stringify(err));
    },
  });
  const { write: approveWrite } = useContractWrite({
    ...approveConfig,
    onMutate(data) {
      toastId.current = toast("Please wait...", { isLoading: true });
    },
    onSuccess(data) {
      console.warn("writen contract approve:\n", data);
      // add pending tx hash in rainbowkit 
      addRecentTransaction({
        hash: data.hash,
        description: `approve`,
        confirmations: 1,
      });
      // wati tx confirmed 1 block
      data
        .wait(1)
        .then((res) => {
          console.warn("transaction confirmed", res);
          toast.update(toastId.current as Id, {
            render: "approve successfully",
            type: toast.TYPE.SUCCESS,
            isLoading: false,
            autoClose: 3_000,
          });
          setIsApproved(true);
        })
        .catch((err) => {
          console.error(err);
          toast.update(toastId.current as Id, {
            render: err,
            type: toast.TYPE.ERROR,
            isLoading: false,
          });
        });
    },
    onError(err: any) {
      toast.update(toastId.current as Id, {
        render: JSON.stringify(err),
        type: toast.TYPE.ERROR,
        isLoading: false,
        autoClose: 5_000,
      });
    },
  });

  // function swapExactTokensForTokens(
  //   uint amountIn,
  //   uint amountOutMin,
  //   address[] calldata path,
  //   address to,
  //   uint deadline
  // ) external returns (uint[] memory amounts);
  const { config: swapConfig } = usePrepareContractWrite({
    ...router2ContractConfig,
    enabled: isConnected && !allowanceLoading && isApproved && inputAmount.gt(BigNumber.from("0")),
    functionName: "swapExactTokensForTokens",
    args: [
      inputAmount,
      0,
      [
        tokens[inputIndex].config.address,
        tokens[outputIndex].config.address,
      ],
      address,
      expiredTime
    ],
    onSuccess(data) {
      console.warn(data)
    },
    onError(err: any) {
      toast(JSON.stringify(err));
    },
  });
  const { write: swapWrite, isLoading: swapLoading } = useContractWrite({
    ...swapConfig,
    onMutate(data) {
      toastId.current = toast("Please wait...", { isLoading: true });
    },
    onSuccess(data) {
      console.warn("writen contract swap:\n", data);
      // add pending tx hash in rainbowkit 
      addRecentTransaction({
        hash: data.hash,
        description: `swapExactTokensForTokens()`,
        confirmations: 1,
      });
      // wati tx confirmed 1 block
      data
        .wait(1)
        .then((res) => {
          console.warn("transaction confirmed", res);
          toast.update(toastId.current as Id, {
            render: "swap successfully",
            type: toast.TYPE.SUCCESS,
            isLoading: false,
            autoClose: 3_000,
          });
        })
        .catch((err) => {
          console.error(err);
          toast.update(toastId.current as Id, {
            render: err,
            type: toast.TYPE.ERROR,
            isLoading: false,
          });
        });
    },
    onError(err: any) {
      toast.update(toastId.current as Id, {
        render: JSON.stringify(err),
        type: toast.TYPE.ERROR,
        isLoading: false,
        autoClose: 5_000,
      });
    },
  });


  return (
    <Container>
      <Main>
        <Title>Swap</Title>
        <Description>
          <Link href="/">
            <a>&larr; Go Back</a>
          </Link>
        </Description>
        <ConnectButton />
        <SwapBox>
          <TokenList>
            <h3>input token:</h3>
            {tokens.map((item, index) => (
              <label key={index}>
                <input name="inputToken" type="radio" checked={index == inputIndex} onChange={(e: any) => {
                  setInputIndex(index)
                  if (outputIndex == index) {
                    setOutputIndex((index+1) % tokens.length)
                  }
                 }} />
                {item.name}
              </label>
            ))}
            <input type="text" value={formatEther(inputAmount)} onChange={(e:any) => {
              let value = e.target.value;
              if (value && value !== '') {
                setInputAmount(parseEther(value));
              } else {
                setInputAmount(BigNumber.from("0"))
                setOutputAmount(BigNumber.from("0"))
              }
            }} />
          </TokenList>
          <TokenList>
            <h3>output token:</h3>
            {tokens.map((item, index) => (
              <label key={index}>
                <input name="outputToken" type="radio" checked={index == outputIndex} onChange={(e: any) => {
                  setOutputIndex(index)
                  if (inputIndex == index) {
                    setInputIndex((index+1) % tokens.length)
                  }
                }} />
                {item.name}
              </label>
            ))}
            <input type="text" value={formatEther(outputAmount)} disabled/>
          </TokenList>
        </SwapBox>
        <RainbowButton disabled={allowanceLoading || isApproved} onClick={approveWrite as MouseEventHandler}>
          {isApproved ? "Already approved" : "Approve"}
        </RainbowButton>
        <RainbowButton 
          className={isApproved && swapWrite ? "rainbow" : ""} disabled={!swapWrite}
          onClick={swapWrite as MouseEventHandler}
        >{swapLoading ? "swaping..." : "Swap"}</RainbowButton>
      </Main>
    </Container>
  );
}

