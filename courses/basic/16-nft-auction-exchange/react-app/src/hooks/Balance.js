import { useState, useEffect, useCallback } from "react";
import usePoller from "./Poller";
import useOnBlock from "./OnBlock";

/*
  ~ What it does? ~

  Gets your balance in ETH from given address and provider

  ~ How can I use? ~

  const yourLocalBalance = useBalance(localProvider, address);

  ~ Features ~

  - Provide address and get balance corresponding to given address
  - Change provider to access balance on different chains (ex. mainnetProvider)
  - If no pollTime is passed, the balance will update on every new block
*/

let DEBUG = false

export default function useBalance(contract, address, provider,pollTime = 0) {

const [balance, setBalance] = useState();

const pollBalance = useCallback(async (contract, address) => {
  if (contract.SimpleToken && address) {
    const newBalance = parseInt(await contract.SimpleToken.balanceOf(address));
    if (newBalance !== balance) {
      setBalance(newBalance);
    }
  }
}, [contract, address]);

// Only pass a provider to watch on a block if there is no pollTime
useOnBlock((pollTime === 0)&& provider, () => {
  if (contract && address && pollTime === 0) {
    pollBalance(contract, address);
}
})

// Use a poller if a pollTime is provided
usePoller(async () => {
  if (contract && address && pollTime > 0) {
    if (DEBUG) console.log('polling!', address)
    pollBalance()
  }
}, pollTime, contract && address)

return balance;
}
