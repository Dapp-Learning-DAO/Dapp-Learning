/*
There are two way to fetch data from TheGraph
*/
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
    // operationName: {}, //optional
    // context: {}, //optional
    // extensions: {}, //optional
  };


// define the mysql connection
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

// inital timestamp filter value
var _timestamp_gt = 0;


// 更新 trace 表中 timeStamp 的最新值
function updateTrace(){
  connection.query('update trace set filter = ? where target = ?',[_timestamp_gt,'mints'], (err, results) => {
    if(err){
      console.log("update trace failed: ", err)
    }
    fetchMore()
  })
}

  // 开始抓取数据
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
      // 返回的 pools 是 object 类型, 需要进行遍历提取其中的 mints
      // 同时, mints 也是 object 类型，需要进行第二层遍, 提取其中单个的 mint
        Object.keys(obj[0].mints).forEach(m => {
          connection.query('INSERT INTO mints(id,pool_id, mint_timestamp, owner, origin, amount, mint_amount0, mint_amount1, mint_amountUSD, mint_tickLower, mint_tickUpper, mint_transaction_id, mint_transaction_gasUsed, mint_transaction_gasPrice) \
              VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [obj[0].mints[m].id,obj[0].id, obj[0].mints[m].timestamp, obj[0].mints[m].owner, obj[0].mints[m].origin,parseInt(obj[0].mints[m].amount), parseFloat(obj[0].mints[m].amount0), parseFloat(obj[0].mints[m].amount1), parseFloat(obj[0].mints[m].amountUSD), parseInt(obj[0].mints[m].tickLower), parseInt(obj[0].mints[m].tickUpper), obj[0].mints[m].transaction.id,
               obj[0].mints[m].transaction.id, obj[0].mints[m].transaction.gasUsed,parseInt(obj[0].mints[m].transaction.gasPrice)], (err, results) => {
              if(err){
                  console.log(err);
              }
            })

            // 更新过滤条件 _timestamp_gt
            if(obj[0].mints[m].timestamp > _timestamp_gt){
              _timestamp_gt = parseInt(obj[0].mints[m].timestamp)
            }
        })
  
        // 如果返回记录数不足 1000，说明没有后续记录，更新 trace 表后退出
        if(obj[0].mints.length != 1000){
          connection.query('update trace set filter = ? where target = ?',[_timestamp_gt,'mints'], (err, results) => {
            if(err){
              console.log("update trace for mints failed :",err)
            }
          })
          connection.end()
          process.exit(0)
        }else{
          // 否则，调用  updateTrace 函数进行循环处理
          updateTrace()
        }
      },
      error: error => console.log(`received error ${error}`),
      complete: () => console.log(`complete`),
    });
  }

  
 // 查询跟踪表 trace 中记录的目前最大值
 module.exports.doMintsFetch = function(){  
  connection.query('select filter from trace where target = ?',['mints'],(err, results) => {
    _timestamp_gt = results[0].filter
    fetchMore()
  })
}

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