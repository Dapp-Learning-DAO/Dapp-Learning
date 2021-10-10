# Protocol Components

Overview of the protocol, constituent components, and terminology.

[SUGGEST EDITS](https://wyvernprotocol.com/docs)

### Overview

Wyvern is a first-order decentralized exchange protocol. Comparable existing protocols such as [Etherdelta](https://github.com/etherdelta/smart_contract), [0x](https://github.com/0xProject/0x-monorepo), and [Dexy](https://github.com/DexyProject/protocol) are zeroeth-order: each order specifies a desired trade of two discrete assets (generally two tokens in a particular ratio and a maximum amount). Wyvern orders instead specify predicates over state transitions: an order is a function mapping a call made by the maker, a call made by the counterparty, and order metadata to a boolean (whether or not the order will match). These predicates are arbitrary - any asset or any combination of assets representable on Ethereum can be exchanged with a Wyvern order - and indeed, Wyvern can instantiate all the aforementioned protocols.

Advantages

- Extremely flexible: can express any orders simpler protocols can express, and many they cannot
- Near-optimally gas-efficient: most gas consumption is in the actual calls and in the calldata predicates
- Security-conducive: constituent protocol components are isolated, core protocol is minimal

Disadvantages

- Not (quite) as developer-friendly; a bit easier to misuse
- Not as well-supported by user-level tooling (e.g. Metamask displaying signed messages)

### Order schema

```
struct Order {
    address registry;
    address maker;
    address staticTarget;
    bytes4  staticSelector;
    bytes   staticExtradata;
    uint256 maximumFill;
    uint256 listingTime;
    uint256 expirationTime;
    uint256 salt;
}
```

| Name            | Type    | Purpose                                                      |
| --------------- | ------- | ------------------------------------------------------------ |
| registry        | address | Registry to be used for the call                             |
| maker           | address | Order maker, who will execute the call                       |
| staticTarget    | address | Target address for predicate function                        |
| staticSelector  | bytes4  | Selector (hash of function signature) for predicate function |
| staticExtradata | bytes   | Extra data for predicate function                            |
| maximumFill     | uint256 | Maximum fill, after which the order cannot be matched        |
| listingTime     | uint256 | Order listing time, before which the order cannot be matched |
| expirationTime  | uint256 | Order expiration time, after which the order cannot be matched |
| salt            | uint256 | Order salt for hash deduplication                            |

All fields are signed over.

### Constructing an order

#### Asserting registry

The order maker may check that they and their counterparty are using valid registries (though registries are also whitelisted in the Exchange contract).

#### Asserting calldata

The bulk of the logic in an order is in constructing the predicate over the call and countercall. Each order's static callback (predicate function) receives all parameters of the call, counterparty call, and order metadata (Ether value, timestamp, matching address) and must decide whether to allow the order to match, and if so how much to fill it.

##### Call

The first call is executed by the maker of the order through their proxy contract. The static callback receives all parameters - the call target, the call type (`CALL` or `DELEGATECALL`), and the call data - and must validate that the call is one which the maker is willing to perform (e.g. transferring a particular asset or set of assets).

##### Countercall

The second call is executed by the counterparty and referred to in the source as the "countercall" for convenience. The static callback receives all parameters - the countercall target, the countercall type (`CALL` or `DELEGATECALL`), and the countercall data - and must validate that the call is one which the maker is willing to accept in return for their own (e.g. transferring a particular asset or set of assets).

#### Asserting state

Static calls are executed *after* the calls (the whole transaction is reverted if the static call fails), so instead of asserting properties of the calldata, you can assert that particular state has changed - e.g. that an account now owns some asset. In some cases this may be more efficient, but it is trickier to reason through and could lead to unintentional consequences if the state changed for other reasons (for example, if the asset you were trying to buy were gifted to you) - so this is recommended for special cases only, such as placing a bug bounty on a contract if an invariant is violated.

#### Metadata

Metadata contains order listing time, order expiration time, counterorder listing time, Ether passed in the call (if any), current order fill value, and the matching address.

#### Generalized Partial Fill

Orders sign over a maximum fill, and static calls return a uint, which specifies the updated fill value if the order is matched. The current fill of an order can also be manually set by the maker of the order with a transaction (this also allows for order cancellation). Note that setting the fill of an order to a nonzero value also implicitly authorizes the order, since authorization of partially filled orders is cached to avoid unnecessary signature checks.

### Authorizing an order

Orders must always be authorized by the `maker` address, who owns the proxy contract which will perform the call. Authorization can be done in three ways: by signed message, by pre-approval, and by match-time approval.

#### Signed message

The most common method of authorizing an order is to sign the order hash off-chain. This is costless - any number of orders can be signed, stored, indexed, and perhaps listed on a website or automated orderbook. To avoid the necessity of cancelling no-longer-desired orders, makers can sign orders with expiration times in the near future and re-sign new orders for only as long as they wish to continue soliciting the trade.

#### Pre-approval

Alternatively, an order can be authorized by sending a transaction to the `WyvernExchange` contract. This method may be of particular interest for orders constructed by smart contracts, which cannot themselves sign messages off-chain. On-chain authorization emits an event which can be easily indexed by orderbooks who may wish to include the order in their database.

#### Match-time approval

Finally, an order can be constructed on the fly (likely to match an existing previously signed or approved order) and authorized at match time simply by sending the match transaction from the order's `maker` address. If the maker intends to send the transaction matching the order themselves, this method may be convenient, and it can be used to save a bit of gas (since calldata verification is implied by sending the transaction).

### Matching orders

#### Constructing matching calldata

Matching calldata can be constructed in any fashion off-chain. The protocol does not care how the final calldata is obtained, only that it fulfills the orders' predicate functions. In practice, orderbook maintainers (relayers) will likely store additional metadata along with orders which can be used to construct possible matching calldatas.

#### Asymmetries

To the extent possible, the protocol is designed to be symmetric, such that orders need not be on any particular "side" and restrict themselves to matching with orders on the other "side".

##### Call ordering

The first asymmetry is ordering. One call must be executed first, and executing that call might change the result of the second call. The first call passed into `atomicMatch` is executed first.

##### Special-cased Ether

The second asymmetry is special-cased Ether. Due to Ethereum design limitations, Ether is a wired-in asset (unlike ERC20 tokens) which can only be sent from an account by a transaction from said account. To facilitate ease-of-use, Wyvern supports special-case Ether to the maximum extent possible: the matcher of an order may elect to pass value along with the match transaction, which is then transferred to the counterparty and passed as a parameter to the predicate function (which can assert e.g. that a particular amount was sent).

#### Miscellaneous

##### Self-matching

Orders cannot be self-matched; however, two separate orders from the same maker can be matched with each other.

