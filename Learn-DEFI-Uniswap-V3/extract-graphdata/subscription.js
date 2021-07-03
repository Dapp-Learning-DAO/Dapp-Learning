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
const SUBSCRIBE_QUERY = gql`subscription {
    transferEntities {
        id
        from
        to
        value
      }
}
`;

const subscriptionClient = createSubscriptionObservable(
  'wss://api.thegraph.com/subgraphs/name/yingjingyang/zoranfts-subgraph', // GraphQL endpoint
  SUBSCRIBE_QUERY,                                       // Subscription query
  {}                                                // Query variables
);
var consumer = subscriptionClient.subscribe(eventData => {
  // Do something on receipt of the event
  console.log("Received event: ");
  console.log(JSON.stringify(eventData, null, 2));
}, (err) => {
  console.log('Err');
  console.log(err);
});
