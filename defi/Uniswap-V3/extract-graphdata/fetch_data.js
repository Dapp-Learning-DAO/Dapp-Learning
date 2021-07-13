/*
There are two way to fetch data from TheGraph
*/
const { execute, makePromise } = require('apollo-link');
const { HttpLink } = require('apollo-link-http');
const gql = require('graphql-tag');
const fetch = require('node-fetch');
const mysql  = require('mysql');  
const mysql_conf = require('./mysql_conf.json')
 
const query = gql`query($input: String){
    positions(where : { owner: $input }) {
        id
        owner
        liquidity
        pool {
          createdAtTimestamp
          id
        }
        depositedToken0
        depositedToken1
        token0{
          symbol
        }
        token1 {
          symbol
        }
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


// Get data, and insert into mysql
let connection = mysql.createConnection({
  host : mysql_conf.host,
  user : mysql_conf.user, 
  password : mysql_conf.password,
  database : mysql_conf.database
});

connection.connect(function(err) {
  if (err) {
    console.error('连接失败: ' + err.stack);
    return;
  }
  console.log('连接成功 id ' + connection.threadId);
});

// The first way to get data, we can use execute with operation
execute(link, operation).subscribe({
    next: res => {
        let obj = res.data.positions
        Object.keys(obj).forEach(v => {
          connection.query('INSERT INTO swap_positions(id, owner,liquidity,pool_createdAtTimestamp,pool_id,depositedToken0, \
            depositedToken1, token0_symbol, token1_symbol, withdrawnToken0, withdrawnToken1) \
            VALUES(?, ?,?,?,?,?,?,?,?,?,?)', [parseInt(obj[v].id), obj[v].owner, parseInt(obj[v].liquidity), parseInt(obj[v].pool.createdAtTimestamp),obj[v].pool.id, parseFloat(obj[v].depositedToken0), parseFloat(obj[v].depositedToken1), obj[v].token0.symbol, obj[v].token1.symbol, parseFloat(obj[v].withdrawnToken0), parseFloat(obj[v].withdrawnToken1)], (err, results) => {
            if(err){
                console.log(err);
            }
            console.log(results);
          })
          console.log(typeof obj[v].id)
        })
    console.log(res.data)
    connection.end();

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