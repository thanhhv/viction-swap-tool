import dotenv from "dotenv";
import axios from 'axios';
import { ethers } from 'ethers';
import { getQuote, getTokenBalance, approveToken, swap } from './utils/index.js'


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
    address: '0x193fcbb7f9eea67cac0d5a94ec7ccf2141c867ec',
    decimals: 18,
    symbol: 'DADA'
  }
};

const getTokens = async () => {
  try {
    const response = await axios.get(`https://www.vicscan.xyz/api/token/list?offset=0&limit=20`);
    return response?.data?.data;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null
  }
};

async function trackingTokenPrice(signer, tokenIn, tokenOut) {
  const amountIn = 500; // Use 500 C98

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

  const tkprice = tokens.find((tk) => tokenIn.address == tk.address.toLowerCase())
  const usdAmout = tkprice ? (tkprice.price * amountIn).toFixed(2) : 0
  const tokenOutPrice = (Number(usdAmout)/ Number(quote?.quote?.output?.amount)).toFixed(5)

  const quoteBack = await getQuote(
    signer.address,
    tokenOut.address,
    tokenIn.address,
    quote?.quote?.output?.amount.toString()
  );
  if (!quoteBack.quote) {
    console.log(quoteBack.message)
    return
  }

  const usdAmountBack = tkprice ? (Number(quoteBack?.quote?.output?.amount) * tkprice.price).toFixed(2) : 0

  const tokenInBack = quoteBack?.quote?.output?.amount
  const slippage = (100 - (tokenInBack / amountIn) * 100).toFixed(2)

  const message =
    `🛠️ Calculated: swap *${amountIn}* ${tokenIn.symbol} (total $${usdAmout}) to ${quote?.quote?.output?.amount} ${tokenOut.symbol} (price: ${tokenOutPrice})
  try to convert back ${quote?.quote?.output?.amount} ${tokenOut.symbol} then get *${tokenInBack}* ${tokenIn.symbol} (total $${usdAmountBack}).
  ${slippage}% slippage
  ${Number(slippage) < 5 ? '✅ Please convert immediately.' : '⏰ Please wait for another time.'}`

  sendToChannel(message)
}

const sendToChannel = async (message) => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHANNEL_ID =process.env.TELEGRAM_CHANNEL_ID;  // or "-100xxxxxxxxx" if it's private channel
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,	
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    }),
  });

  const data = await res.json();
  console.log("📨 Telegram Channel Response:", data?.ok);
};

let tokens = []

async function main() {

  tokens = await getTokens()
  setInterval(async () => {
    const tks = await getTokens()
    if (tks) {
      tokens = tks
    }
  }, 5 * 60 * 1000)

  const tokenIn = tokenDataSource.C98
  const tokenOut = tokenDataSource.RABBIT
  
  // setInterval(async () => {
    try {
      const signer = new ethers.Wallet(privateKey, provider)
      await trackingTokenPrice(signer, tokenIn, tokenOut)
    } catch (error) {
      console.log(error)
    }
  // }, 10000);
}

main()


