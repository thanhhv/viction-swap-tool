import dotenv from "dotenv";
import Web3 from 'web3'
import { ethers } from 'ethers';
import { getQuote, approveToken, swap, getTokenBalance } from './utils/index.js'

dotenv.config();

const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.viction.xyz'));
const provider = new ethers.providers.JsonRpcProvider('https://rpc.viction.xyz')
const privateKey = process.env.BUY_DADA_PRIVATE_KEY

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
  WHEEE: {
    address: '0x4ade201e7a66c3c9210bab9002522c8fdbc6d1d7',
    decimals: 18,
    symbol: 'WHEEE'
  }
};

async function handleSwapToken(signer, tokenIn, tokenOut) {

  // get current balance of tokenIn
  const balance = await getTokenBalance(signer.address, tokenIn.address, provider)
  console.log(`- Token ${tokenIn.symbol} balance: ${ethers.utils.formatUnits(balance, tokenIn.decimals)}`);

  const balanceB = await getTokenBalance(signer.address, tokenOut.address, provider)
  console.log(`- Token ${tokenOut.symbol} balance: ${ethers.utils.formatUnits(balanceB, tokenOut.decimals)}`);

  const amountIn = balance//  web3.utils.toBigInt(web3.utils.toWei("200", "ether"))

  // get quote
  const quote = await getQuote(
    signer.address,
    tokenIn.address,
    tokenOut.address,
    amountIn.toString()
  );

  if (!quote.quote) {
    console.log(quote.message)
    return
  }

  const uniswapRouter = quote.quote.methodParameters.to
  // // approve token
  await approveToken(tokenOut.address, uniswapRouter, signer)
  await approveToken(tokenIn.address, uniswapRouter, signer)

  // // swap token
  console.log(`Swapping ${ethers.utils.formatUnits(amountIn, tokenIn.decimals)} ${tokenIn.symbol} to ${tokenOut.symbol}`)
  await swap(quote.quote, uniswapRouter, signer)

}

async function main() {

  const tokenIn = tokenDataSource.WHEEE
  const tokenOut = tokenDataSource.C98

  try {
    const signer = new ethers.Wallet(privateKey, provider)
    await handleSwapToken(signer, tokenIn, tokenOut)
    console.log(`DONE swap`)

  } catch (error) {
    console.log(error)
  }
}

main()
