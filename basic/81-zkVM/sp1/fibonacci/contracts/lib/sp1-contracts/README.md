# SP1 Contracts

This repository contains the smart contracts for verifying [SP1](https://github.com/succinctlabs/sp1) EVM proofs.

## Installation

To install the latest release version:

```bash
forge install succinctlabs/sp1-contracts
```

Add `@sp1-contracts/=lib/sp1-contracts/contracts/src/` in `remappings.txt.`

### Usage

Once installed, you can import the `ISP1Verifier` interface and use it in your contract:

```solidity
pragma solidity ^0.8.20;

import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

contract MyContract {
	address public constant SP1_VERIFIER = 0x3B6041173B80E77f038f3F2C0f9744f04837185e;

	bytes32 public constant PROGRAM_VKEY = ...;

	function myFunction(..., bytes calldata publicValues, bytes calldata proofBytes) external {
		ISP1Verifier(SP1_VERIFIER).verifyProof(PROGRAM_VKEY, publicValues, proofBytes);
	}
}
```

You can obtain the correct `SP1_VERIFIER` address for your chain by looking in the [deployments](./contracts/deployments) directory, it's recommended to use the `SP1_VERIFIER_GATEWAY` address which will automatically route proofs to the correct verifier based on their version.

You can obtain the correct `PROGRAM_VKEY` for your program calling the `setup` function for your ELF:

```rs
    let client = ProverClient::new();
    let (_, vk) = client.setup(ELF);
    println!("PROGRAM_VKEY = {}", vk.bytes32());
```

### Deployments

To deploy the contracts, ensure your [.env](./contracts/.env.example) file is configured with all the chains you want to deploy to.

Then you can use the `forge script` command and specify the specific contract you want to deploy. For example, to deploy the SP1 Verifier Gateway you can run:

```bash
FOUNDRY_PROFILE=deploy forge script ./script/deploy/SP1VerifierGateway.s.sol:SP1VerifierGatewayScript --private-key $PRIVATE_KEY --verify --verifier etherscan --multi --broadcast
```

### Adding Verifiers

To deploy a specific SP1 Verifier version and add it to the gateway, run:

```bash
FOUNDRY_PROFILE=deploy forge script ./script/deploy/v1.1.0/SP1Verifier.s.sol:SP1VerifierScript --private-key $PRIVATE_KEY --verify --verifier etherscan --multi --broadcast
```

Change `v1.1.0` to the desired version to add.

To re-verify already existing deployments, remove the `--broadcast` flag.

### Freezing Verifiers

> **BE CAREFUL** When a freezing a verifier. Once it is frozen, it cannot be unfrozen, and it can no longer be routed to.

To freeze a verifier on the gateway, run:

```bash
FOUNDRY_PROFILE=deploy forge script ./script/deploy/v1.1.0/SP1Verifier.s.sol:SP1VerifierScript --private-key $PRIVATE_KEY --verify --verifier etherscan --multi --broadcast --sig "freeze()"
```

Change `v1.1.0` to the desired version to freeze.

## For Developers: Integrate SP1 Contracts

This repository contains the EVM contracts for verifying SP1 PLONK EVM proofs.

You can find more details on the contracts in the [`contracts`](./contracts/README.md) directory.

Note: you should ensure that all the contracts are on Solidity version `0.8.20`.

## For Contributors

To update the SP1 contracts, please refer to the [`update`](./UPDATE_CONTRACTS.md) file.

## Security

SP1 Contracts has undergone an audit from [Veridise](https://www.veridise.com/). The audit report is available [here](./audits).
