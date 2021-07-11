const { execute } = require('apollo-link');
const { WebSocketLink } = require('apollo-link-ws');
const { SubscriptionClient } = require('subscriptions-transport-ws');
const ws = require('ws');
const gql = require('graphql-tag');


const getWsClient = function(wsurl) {
  const client = new SubscriptionClient(
    wsurl, {reconnect: true}, ws
  );
  return client;
};

const createSubscriptionObservable = (wsurl, query, variables) => {
  const link = new WebSocketLink(getWsClient(wsurl));
  return execute(link, {query: query, variables: variables});
};


// A subscription query to get changes for author with parametrised id 
// using $id as a query variable
const SUBSCRIBE_QUERY = gql`subscription($input: String) {
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
}
`;

const subscriptionClient = createSubscriptionObservable(
  'wss:////api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph', // GraphQL endpoint
  SUBSCRIBE_QUERY,                                       // Subscription query
  {'input': '0x4247269401bcb49d8455e275d70c25be9e2f9285'}                                                // Query variables
);
var consumer = subscriptionClient.subscribe(eventData => {
  // Do something on receipt of the event
  console.log("Received event: ");
  console.log(JSON.stringify(eventData, null, 2));
}, (err) => {
  console.log('Err');
  console.log(err);
});
