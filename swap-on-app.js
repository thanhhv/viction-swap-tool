import dotenv from "dotenv";
import { ethers } from 'ethers';
import { promises as fs } from "fs";
import { getQuoteV1, reviewQuoteV1, getTokenBalance, approveToken, swap, transferToken } from './utils/index.js'

const tokenDataSource = {
  C98: {
    address: '0x0fd0288aaae91eaf935e2ec14b23486f86516c8c',
    decimals: 18,
    chainId: 88,
    symbol: 'C98',
  },
  RABBIT: {
    address: '0x2C664910222BE7b7e203753C59A9667cBe282828',
    decimals: 18,
    chainId: 88,
    symbol: 'RABBIT',
  },
  DADA: {
    address: '0x193fcbb7f9eea67cac0d5a94ec7ccf2141c867ec',
    decimals: 18,
    chainId: 88,
    symbol: 'DADA'
  }
};

dotenv.config();

// to track the wallet had tokens when transfer 
const filePath = "current-wallet-has-money-dada.txt";

const provider = new ethers.providers.JsonRpcProvider('https://rpc.viction.xyz')
const privateKeys = process.env.SWAP_DATA_V1_PRIVATE_KEYS.split(',')

async function ensureFileWithPrivateKey() {
  try {
    // check file exists
    await fs.access(filePath);
    const content = await fs.readFile(filePath, "utf8");

    if (!content.trim()) {
      console.log("📂 File exists but is empty. Writing PRIVATE_KEY...");
      await fs.writeFile(filePath, privateKeys[0], "utf8");
      console.log("✅ PRIVATE_KEY written to file.");
    } else {
      console.log("✅ File already exists and is not empty.");
    }
  } catch (error) {
    console.log("📂 File does not exist. Creating with PRIVATE_KEY...");
    await fs.writeFile(filePath, privateKeys[0], "utf8");
    console.log("✅ File created successfully.");
  }
}

async function readFileData(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    console.error("❌ Error reading file:", error);
    return null;
  }
}

async function saveFileData(filePath, data) {
  try {
    await fs.writeFile(filePath, data, "utf8");
    console.log("✅ update new current wallet successfully!");
  } catch (error) {
    console.error("❌ Error saving private key:", error);
  }
}

async function getCurrentBalance(signer, tokenIn, tokenOut) {
  const balanceA = await getTokenBalance(signer.address, tokenIn.address, provider)
  console.log(`${signer.address} - Token ${tokenIn.symbol} balance: ${ethers.utils.formatUnits(balanceA, tokenIn.decimals)}`);

  const balanceB = await getTokenBalance(signer.address, tokenOut.address, provider)
  console.log(`${signer.address} - Token ${tokenOut.symbol} balance: ${ethers.utils.formatUnits(balanceB, tokenOut.decimals)}`);
}

async function handleSwapToken(signer, tokenIn, tokenOut) {
  let data = {
    "id": "539526866334",
    // "amount": "300.01", // 300 DADA
    "token0": tokenIn,
    "token1": tokenOut,
    "wallet": "0xa550E1A1Cbb53fCc9a614514013C0EC3ACAe33c2",
    "isAuto": false,
    "slippage": "0.5",
    "backer": ["Arken"]
  }

  /**
   * WARNING ====== SWAP ALL 
   */
  const balance = await getTokenBalance(signer.address, data.token0.address, provider)
  data['amount'] = ethers.utils.formatUnits(balance, data.token0.decimals).toString()

  const quote = await getQuoteV1(JSON.stringify(data))

  if (!quote?.data?.length) {
    console.log('No route found')
    return
  }

  const additionalData = quote?.data[0].additionalData

  data['backer'] = "Arken"
  data['rawAmount'] = additionalData.fromTokenAmount
  data['quote'] = additionalData
  data['tokenIn'] = data.token0
  data['tokenOut'] = data.token1

  delete data['isAuto']
  delete data['token0']
  delete data['token1']

  const response = await reviewQuoteV1(JSON.stringify(data))
  if (!response.success) {
    console.log('Cannot swap')
    return
  }

  const uniswapRouter = response.data.to
  // // approve token
  await approveToken(data.tokenIn.address, uniswapRouter, signer)
  await approveToken(data.tokenOut.address, uniswapRouter, signer)

  // console.log(response)
  console.log(`Swapping ${data.amount} ${data.tokenIn.symbol} to ${data.tokenOut.symbol}`)
  await swap({ methodParameters: { data: response.data.tx.data, value: '' } }, uniswapRouter, signer)
}

async function main() {
  try {

    const tokenIn = tokenDataSource.C98
    const tokenOut = tokenDataSource.DADA

    let count = 1
    for (const privateKey of privateKeys) {
      const signer = new ethers.Wallet(privateKey, provider)
      await getCurrentBalance(signer, tokenDataSource.C98, tokenDataSource.DADA)

      const currentPrivateKey = await readFileData(filePath)
      // collect all tokens into 1 wallet
      if (currentPrivateKey) {
        const walletHasMoney = new ethers.Wallet(currentPrivateKey, provider)
        if (walletHasMoney.address.toLocaleLowerCase() === signer.address.toLocaleLowerCase()) {
          // The money is belong to the same wallet
          console.log('The money is belong to the same wallet')
        } else {
          const balanceA = await getTokenBalance(walletHasMoney.address, tokenIn.address, provider)
          console.log(`Transferring ${ethers.utils.formatUnits(balanceA, tokenIn.decimals)} ${tokenIn.symbol} from ${walletHasMoney.address} to ${signer.address} ...`)
          await transferToken(walletHasMoney, signer.address, balanceA, tokenIn.address)

          const balanceB = await getTokenBalance(walletHasMoney.address, tokenOut.address, provider)
          console.log(`Transferring ${ethers.utils.formatUnits(balanceB, tokenOut.decimals)} ${tokenOut.symbol} from ${walletHasMoney.address} to ${signer.address} ...`)
          await transferToken(walletHasMoney, signer.address, balanceB, tokenOut.address)

          // update current wallet has funds
          await saveFileData(filePath, privateKey)
        }
      }

      await handleSwapToken(signer, tokenIn, tokenOut)
      await handleSwapToken(signer, tokenOut, tokenIn)

      console.log(`Successful swap ${count} \n`)
      count++
    }
  } catch (error) {
    console.log(error)
  }
}

ensureFileWithPrivateKey();
main()