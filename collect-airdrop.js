import dotenv from "dotenv";
import { ethers } from 'ethers';
import { transferToken, getTokenBalance } from './utils/index.js'


dotenv.config();

const provider = new ethers.providers.JsonRpcProvider('https://rpc.viction.xyz')
const privateKeys = process.env.PRIVATE_KEYS?.split(',')

const tokenDataSource = {
  C98: {
    address: '0x0fd0288aaae91eaf935e2ec14b23486f86516c8c',
    decimals: 18,
    symbol: 'C98',
  },
  RABBIT: {
    address: '0x2C664910222BE7b7e203753C59A9667cBe282828',
    decimals: 18,
    symbol: 'RABBIT',
  },
  DADA: {
    address: '0x193fcbb7f9eea67cac0d5a94ec7ccf2141c867ec',
    decimals: 18,
    symbol: 'DADA'
  },
  ONEID: {
    address: '0x4359647fe0ef8b1ee201d5bc2bb5ab872c395f04',
    decimals: 18,
    symbol: 'ONEID'
  },
};

async function main() {

  const token = tokenDataSource.ONEID
  const collectToAddress = '0xa550E1A1Cbb53fCc9a614514013C0EC3ACAe33c2' //update with your wallet address

  try {
    let count = 0
    for (const privateKey of privateKeys) {
      count++
      const signer = new ethers.Wallet(privateKey, provider)
      const balance = await getTokenBalance(signer.address, token.address, provider)

      console.log(`Token ${token.symbol}: ${ethers.utils.formatUnits(balance, token.decimals)}`)
      if (balance <= 0) {
        console.log(`Skip wallet ${count} \n`)
        continue
      }

      console.log(`Transferring ${ethers.utils.formatUnits(balance, token.decimals)} ${token.symbol} from ${signer.address} to ${collectToAddress} ...`)
      await transferToken(signer, collectToAddress, balance, token.address)

      console.log(`Done wallet ${count} \n`)
    }
  } catch (error) {
    console.log(error)
  }
}

main()
