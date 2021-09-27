import { ethers, run } from 'hardhat';
 import { ApolloClient, InMemoryCache,  gql, HttpLink } from '@apollo/client/core';
import fetch  from 'node-fetch';
import { createClient } from 'urql/core';
async function main() {
 // await run('compile');

  const accounts = await ethers.getSigners();
  const POOL_ADDRESSES_PROVIDER_ADDRESS = "0xd05e3E715d945B59290df0ae8eF85c1BdB684744";

  const RESERVE_GRAPHQL = `
  {
      pool (id: "0xd05e3E715d945B59290df0ae8eF85c1BdB684744"){
        id
        lendingPool
       
      }
    }
  `
// const RESERVE_GQL = gql(RESERVE_GRAPHQL);
const uri = 'https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic';


const client = createClient({
  url: uri
});

 //const data = await client.query(tokensQuery).toPromise();

// const client = new ApolloClient({
//   uri: "https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic",
//   //uri: "https://api.studio.thegraph.com/query/",
//   cache: new InMemoryCache()
// });




// const link = new HttpLink({ uri, fetch });


let data = await client.query(
 RESERVE_GRAPHQL).toPromise();

console.log(data);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
