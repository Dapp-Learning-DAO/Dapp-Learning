## Dev preparation
+ It is a preparation doc for your developing of Arweave.
+ Some acknowledgments you should know.
### Create a AR wallet
+ get Chrome extension [here](https://chrome.google.com/webstore/detail/arweave/iplppiggblloelhoglpmkmbinggcaaoc)
+ [More help](https://docs.arweave.org/info/wallets/arweave-web-extension-wallet)
+ If you forget the encryption passphrase, just re-import the downloaded json file(It is very important to keep security)
## Http
### Config
+ The default port is 1984.
+  http://159.65.213.43:1984/info， or https://arweave.net/info.
+ curl --request GET \
  --url 'https://arweave.net/info'
### Language
+ integrations for Go, PHP, Scala (which can also be used with Java and C#) and JavaScript/TypeScript/NodeJS. 
+ [TS/NodeJs SDKs](https://github.com/ArweaveTeam/arweave-js)
+ [GO SDKs](https://github.com/everFinance/goar) 

### Other
+ Nodes and gateways accept transactions through the POST /tx endpoint. 
+ Transaction and block identifiers and wallet addresses, among some other fields, are encoded as Base64URL strings.
+ A transaction may be used for uploading data, transferring tokens, or both.
+ Signatures are RSA-PSS with SHA-256 as the hashing function.
+ A transaction may be used for uploading data, transferring tokens, or both.
+ Arweave uses the JSON Web Key (JWK) format (RFC 7517) with 4096 length RSA-PSS keys. This JWK format allows for cryptographic keys to be represented as a JSON object where each property represents a property of the underlying cryptographic key.
+ Winston is the smallest possible unit of AR, similar to a satoshi in Bitcoin, or wei in Ethereum.
+ 1 AR = 1000000000000 Winston (12 zeros) and 1 Winston = 0.000000000001 AR.
+ https://arweave.net/tx/{id}
+ https://arweave.net/tx/{id}/status
+ https://arweave.net/tx/{id}/{field}
+ http://arweave.net/{id}
+ http://arweave.net:1984/tx/{id}/data.{extension}

### More
+ [http API](https://docs.arweave.org/developers/server/http-api)

## Upload tool arkb
+ 
```
npm install -g arkb
arkb deploy ./folder --wallet path/to/my/wallet.json
arkb wallet-save path/to/arweave-wallet-key.json
arkb deploy ./folder
```
+ if arkb deploy ./folder --use-bundler http://bundler.arweave.net:10000
```
arkb deploy ./folder --use-bundler http://bundler.arweave.net:10000
```
+ 
```
arkb status YOUR_TRANSACTION_ID

# arkb status ERWTghgB8wDkOdKJ-8F1ne6BPIybv_rMLQPGP8c3YuE
Confirmed: true | Status: 200
```
+ 
```
# arkb balance
pEbU_SLfRzEseum0_hMB1Ie-hqvpeHWypRhZiPoioDI has a balance of 10.113659492352 AR
```
+ [More](https://docs.arweave.org/developers/tools/textury-arkb)

## PermonWeb
+ Permaweb apps are built using normal web technologies — HTML, CSS, and Javascript — but are deployed to Arweave’s on-chain storage system, making them permanent and available in a fast, decentralised manner. 
+ You can deploy a permaweb app in 2 minutes or less with Arweave Deploy!
+ [More](https://docs.arweave.org/developers/hackathon)
+ [Arweave Dapps](https://mtfvznw2pwxykoicvxpoe7ao5rp4nhaueueux2bbe4klxankdhra.arweave.net/ZMtcttp9r4U5Aq3e4nwO7F_GnBQlCUvoIScUu4GqGeI/)