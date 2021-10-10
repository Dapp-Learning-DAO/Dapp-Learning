import { NFTStorage, File } from 'nft.storage';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config()


const apiKey = process.env.apiKey
console.log(apiKey)
const client = new NFTStorage({ token: apiKey })

const data = readFileSync('data/matic.jpeg')

const metadata = await client.store({
  name: 'Pinpie',
  description: 'Pin is not delicious beef!',
  image: new File(data, 'matic.jpeg', { type: 'image/jpg' })
})
console.log(metadata)