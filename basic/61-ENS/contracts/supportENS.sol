// This is a quick and small library for allowing any contract to
// use ENS names like they would use a standard address.
// So a DAO can have bob.eth as the member, instead of 0x123,
// and therefore Bob can change that address to whatever they prefer
// or give out a tip that can be only received by the rightful owner of example.com
// even if example.com owner never heard about ethereum!
//
// To use it, just use a store the NameHash as a string and then call
// updateAddress(NameHash) to save the latest ethereum address it points to
// Once that has been saved, use ensAddresses(NameHash) to obtain a valid eth address.
// Optionally, you can check lastUpdatedENSAt(NameHash) to check the last time
// it was updated. If it was never updated then both functions should return 0:
// IMPORTANT: check if address is not address(0) before sending ether.

// Learn more about NameHash: https://docs.ens.domains/contract-api-reference/name-processing
// Learn more about full DNS support in ENS: https://medium.com/the-ethereum-name-service/full-dns-namespace-integration-to-ens-now-on-mainnet-9d37270807d3
// Learn more about ENS: ens.domains

// Author: Alex Van de Sande
// License: Public Domain

pragma solidity ^0.8.0;

abstract contract  ENS {
    function resolver(string memory node) public virtual view  returns (Resolver);
}

abstract contract Resolver {
    function addr(string memory node) public virtual view returns (address);
}

contract SupportsENS {
    // Same address for Mainet, Ropsten, Rinkerby, Gorli and other networks;
    ENS ens = ENS(0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e);

    // Optional modifier to only allow calls from a specific ENS owner
    modifier onlyENSOwner(string memory nameHash) {
        require(
            msg.sender == getENSAddress(nameHash),
            "Only ENS owner can call this contract"
            );
            _;
    }

    // Main function to get an address
    // ATTENTION: if an ENS is not set or claimed, it will return 0x0.
    // Make sure to check this before sending ether.
    function getENSAddress(string memory nameHash) public view returns (address){
        Resolver resolver = ens.resolver(nameHash);
        return resolver.addr(nameHash);
    }

    // Similar to the function above but will
    // revert if the address returns 0x00..
    function getSafeENSAddress(string memory nameHash) public view returns (address){
        Resolver resolver = ens.resolver(nameHash);
        address res = resolver.addr(nameHash);
        require(res != address(0), "address not set or set to burn");
        return res;
    }

}