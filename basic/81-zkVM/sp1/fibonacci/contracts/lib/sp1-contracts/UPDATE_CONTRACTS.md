
# Update SP1 Contracts with New SP1 Version

This section outlines the steps required to update the SP1 contracts repository with a new SP1 version. Follow these instructions to ensure the SP1 contracts are correctly updated and aligned with the latest version.


1. Change the version tag in `Cargo.toml` to the target `sp1` version.

```toml
[dependencies]
sp1-sdk = { git = "https://github.com/succinctlabs/sp1", tag = "<SP1_TAG>" }
```

2. Update `contracts/src` with the new verifier contracts.

```bash
cargo update

cargo run --bin artifacts --release
```

3. Open a PR to commit the changes to `main`.
4. After merging to `main`, create a release tag with the same version as the `sp1` tag used.

## Miscellaneous
The SP1 Solidity contract artifacts are included in each release of `sp1`. You can see how these are included in the `sp1` repository [here](https://github.com/succinctlabs/sp1/blob/21455d318ae383b317c92e10709bbfc313d8f1df/recursion/gnark-ffi/src/plonk_bn254.rs#L57-L96).

