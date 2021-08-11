const { execute, makePromise } = require('apollo-link');
const { HttpLink } = require('apollo-link-http');
const gql = require('graphql-tag');
const fetch = require('node-fetch');
const mysql  = require('mysql');  
const sqlVariables = require('./sqlVariables.json')
 
const query_position = gql`query($_pool_id: String, $_timestamp_gt: Int){
  pools(where : {id : $_pool_id } ) {
    id
    mints( where: {timestamp_gt : $_timestamp_gt } , first:1000 , orderBy: timestamp){
      id
      timestamp
      owner
      origin
      amount
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      transaction {
        id
        gasUsed
        gasPrice
      }
    }
  }
}`;

const variables = {
  '_pool_id': sqlVariables._pool_id,
  '_origin': sqlVariables._owner,
  '_timestamp_gt': 0
};
  

const uri = 'https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph';


const link = new HttpLink({ uri, fetch });

const operation = {
    query: query_position,
    variables, //optional
  };



let connection = mysql.createConnection({
  host : sqlVariables.host,
  user : sqlVariables.user, 
  password : sqlVariables.password,
  database : sqlVariables.database
});

connection.connect(function(err) {
  if (err) {
    console.error('连接失败: ' + err.stack);
    return;
  }
  console.log('连接成功 id ' + connection.threadId);
});


var _timestamp_gt = 0;


function updateTrace(){
  connection.query('update trace set filter = ? where target = ?',[_timestamp_gt,'mints'], (err, results) => {
    if(err){
      console.log("update trace failed: ", err)
    }
    fetchMore()
  })
}


function fetchMore(){
    variables._timestamp_gt = _timestamp_gt
    console.log("Current TimeStamp: ",_timestamp_gt)
    execute(link, operation).subscribe({
      next: res => {
        console.log("query result is ",res)
        let obj = res.data.pools
        if(!obj){
          connection.end()
          process.exit(0)
        }

        Object.keys(obj[0].mints).forEach(m => {
          connection.query('INSERT INTO mints(id,pool_id, mint_timestamp, owner, origin, amount, mint_amount0, mint_amount1, mint_amountUSD, mint_tickLower, mint_tickUpper, mint_transaction_id, mint_transaction_gasUsed, mint_transaction_gasPrice) \
              VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [obj[0].mints[m].id,obj[0].id, obj[0].mints[m].timestamp, obj[0].mints[m].owner, obj[0].mints[m].origin,parseInt(obj[0].mints[m].amount), parseFloat(obj[0].mints[m].amount0), parseFloat(obj[0].mints[m].amount1), parseFloat(obj[0].mints[m].amountUSD), parseInt(obj[0].mints[m].tickLower), parseInt(obj[0].mints[m].tickUpper), obj[0].mints[m].transaction.id,
               obj[0].mints[m].transaction.id, obj[0].mints[m].transaction.gasUsed,parseInt(obj[0].mints[m].transaction.gasPrice)], (err, results) => {
              if(err){
                  console.log(err);
              }
            })

            if(obj[0].mints[m].timestamp > _timestamp_gt){
              _timestamp_gt = parseInt(obj[0].mints[m].timestamp)
            }
        })
  
        if(obj[0].mints.length != 1000){
          connection.query('update trace set filter = ? where target = ?',[_timestamp_gt,'mints'], (err, results) => {
            if(err){
              console.log("update trace for mints failed :",err)
            }
          })
          connection.end()
          process.exit(0)
        }else{
          updateTrace()
        }
      },
      error: error => console.log(`received error ${error}`),
      complete: () => console.log(`complete`),
    });
  }


 module.exports.doMintsFetch = function(){  
  connection.query('select filter from trace where target = ?',['mints'],(err, results) => {
    _timestamp_gt = results[0].filter
    fetchMore()
  })
}
