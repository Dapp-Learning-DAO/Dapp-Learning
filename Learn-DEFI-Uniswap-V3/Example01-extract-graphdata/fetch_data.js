/*
There are two way to fetch data from TheGraph
The first one, we can use execute with operation
*/
const { execute, makePromise } = require('apollo-link');
const { HttpLink } = require('apollo-link-http');
const gql = require('graphql-tag');
const fetch = require('node-fetch');
 
const query = gql`query($input: String){
    positions(where : { owner: $input }) {
        id
        owner
        liquidity
        depositedToken0
        depositedToken1
        withdrawnToken0
        withdrawnToken1
    }
}`;

const variables = {
    'input': '0x4247269401bcb49d8455e275d70c25be9e2f9285'
};
  

const uri = 'https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';


const link = new HttpLink({ uri, fetch });

const operation = {
    query: query,
    variables, //optional
    // operationName: {}, //optional
    // context: {}, //optional
    // extensions: {}, //optional
  };

execute(link, operation).subscribe({
    next: res => {
        console.log(res.data)
    },
    error: error => console.log(`received error ${error}`),
    complete: () => console.log(`complete`),
  });


/*
Second one, we can fetch data directly
*/

/* async function fetchData() {
    const response = await fetch(uri, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `
        query { factories(first: 5) {
          id
          poolCount
          txCount
          totalVolumeUSD
        } }
        `,
      }),
    });
  
    const responseBody = await response.json();
    console.log(JSON.stringify(responseBody));
  }
  
  fetchData(); */