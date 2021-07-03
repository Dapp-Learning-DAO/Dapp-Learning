// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // await hre.run('compile');
  const [owner, Alice, Bob] = await hre.ethers.getSigners()

  console.log('owner:', owner.address)
  console.log('Alice:', Alice.address)
  console.log('Bob:', Bob.address)

  //todo deploy erc721 & erc20
  // const erc20 = "0x7B698903d4A52f0A00a4288C0f1b9bC07B161748";
  //const erc721 = '0xBf2efA0AdB1DaFBF051B302F881bAC56c2a35db7'
  //const auction = '0x09d09A4E7b8eE3c21aB91b2404a5c7Cfec4cf90e'

  //  const token = await hre.ethers.getContractAt("contracts/IERC20.sol:IERC20",erc20);

  const tokenContractFactory = await ethers.getContractFactory('SimpleToken')
  const token = await tokenContractFactory.deploy('HEHE', 'HH', 1, 100000000)
  await token.deployed()

  const erc20 = token.address

  console.log('Token address:', token.address)

  await token.transfer(Alice.address, 1000)

  const bal = await token.balanceOf(Alice.address)
  console.log('alice erc20 balance after: ', bal.toNumber())

  const nfttokenContractFactory = await ethers.getContractFactory('MYERC721')
  const nfttoken = await nfttokenContractFactory.deploy("MYERC721", "MYERC721", "MYERC721")
  await nfttoken.deployed()
  
  const erc721 = nfttoken.address


  await nfttoken.mintWithTokenURI(owner.address, 'www.baidu.com')

  let nftbalBigNumber = await nfttoken.balanceOf(owner.address)
  let erc721Id = nftbalBigNumber.toNumber() - 1
  console.log('owner nft balance', nftbalBigNumber.toNumber())

  const auctionContractFactory = await ethers.getContractFactory('AuctionFixedPrice')
  const auctionFixedPrice = await auctionContractFactory.deploy()
  await auctionFixedPrice.deployed()
  
  const auction = auctionFixedPrice.address

  let auctionFixedPriceAlice = auctionFixedPrice.connect(Alice)
  console.log('auctionFixedPrice deployed to:', auctionFixedPrice.address)
  await nfttoken.approve(auction, erc721Id)

  //   console.log("approveTx: ", approveTx)
  console.log(erc721Id, 'owner approve auction erc721 transfer successfully')

  var timestamp = new Date().getTime()
  const endTime = timestamp + 3600 * 1000
  console.log('endtime: ', endTime)

  await auctionFixedPrice.createTokenAuction(
    erc721,
    erc721Id,
    erc20,
    100,
    endTime
  )
  console.log('owner create token  {} auction successfully:  ', erc721Id)
  const auctionDetail = await auctionFixedPrice.getTokenAuctionDetails(
    erc721,
    erc721Id
  )

  let tokenAlice = token.connect(Alice)

  await tokenAlice.approve(auction, 1000)

  let allow = await token.allowance(Alice.address, auction)
  console.log('alice allowans ', allow.toNumber())

  await auctionFixedPriceAlice.purchaseNFTToken(erc721, erc721Id)

  console.log('alice purchase successfully: ')

  const auctionDetail1 = await auctionFixedPrice.getTokenAuctionDetails(
    erc721,
    erc721Id
  )

  let erc721IdOwner = await nfttoken.ownerOf(erc721Id)

  console.log(auctionDetail1)
  console.log(erc721Id, 'nft owner: ', erc721IdOwner)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
