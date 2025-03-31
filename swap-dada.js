import dotenv from "dotenv";
import { ethers } from 'ethers';
import { getQuote, approveToken, swap } from './utils/index.js'

dotenv.config();

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
    address: '0x29cBfe5Cd231f2Cff086de27f0d820d8b15CC306',
    decimals: 18,
    symbol: 'DADA'
  }
};

async function handleSwapToken(signer, tokenIn, tokenOut) {

  const amountIn = 2000 // 2000 C98

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
  console.log(`Swapping ${ethers.utils.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol} to ${tokenOut.symbol}`)
  await swap(quote.quote, uniswapRouter, signer)

}

async function main() {

  const tokenIn = tokenDataSource.C98
  const tokenOut = tokenDataSource.DADA

  try {
    const signer = new ethers.Wallet(privateKey, provider)
    await handleSwapToken(signer, tokenIn, tokenOut)
    console.log(`DONE swap`)

  } catch (error) {
    console.log(error)
  }
}

main()
