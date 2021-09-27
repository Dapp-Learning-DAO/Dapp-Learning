import { ethers, run } from 'hardhat';
import { useQuery, gql } from '@apollo/client';


async function main() {
 // await run('compile');

  const accounts = await ethers.getSigners();
  const POOL_ADDRESSES_PROVIDER_ADDRESS = "0xd05e3E715d945B59290df0ae8eF85c1BdB684744";

  const RESERVE_GRAPHQL = `
  {
      pool (id: "${POOL_ADDRESSES_PROVIDER_ADDRESS.toLowerCase()}"){
        id
        lendingPool
        reserves {
          id
          underlyingAsset
          symbol
          name
        }
      }
    }
  `
const RESERVE_GQL = gql(RESERVE_GRAPHQL)
const { loading, data } = useQuery(RESERVE_GQL,{pollInterval: 6000});
console.log(data);
console.log(loading);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
