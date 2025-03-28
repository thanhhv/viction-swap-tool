import dotenv from "dotenv";
import { ethers } from 'ethers';
import { getQuote, getTokenBalance, approveToken, swap, transferToken } from './utils/index.js'
import { promises as fs } from "fs";

// to track the wallet had tokens when transfer 
const filePath = "current-wallet-has-money.txt";

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
    address: '0x29cBfe5Cd231f2Cff086de27f0d820d8b15CC306',
    decimals: 18,
    symbol: 'DADA'
  }
};

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

async function handleSwapToken(signer, tokenIn, tokenOut) {
  // get current balance of tokenIn
  const balance = await getTokenBalance(signer.address, tokenIn.address, provider)

  const amountIn = balance; // Use all token balance for swap

  if (amountIn == 0) {
    console.log('Not enough liquidity')
    return
  }

  // get quote
  const quote = await getQuote(
    signer.address,
    tokenIn.address,
    tokenOut.address,
    amountIn.toString()
  );

  const uniswapRouter = quote.quote.methodParameters.to
  // // approve token
  await approveToken(tokenOut.address, uniswapRouter, signer)
  await approveToken(tokenIn.address, uniswapRouter, signer)

  // // swap token
  console.log(`Swapping ${ethers.utils.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol} to ${tokenOut.symbol}`)
  await swap(quote.quote, uniswapRouter, signer)

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

async function main() {

  const tokenIn = tokenDataSource.C98
  const tokenOut = tokenDataSource.RABBIT

  try {
    let count = 1
    for (const privateKey of privateKeys) {
      const signer = new ethers.Wallet(privateKey, provider)

      await getCurrentBalance(signer, tokenDataSource.C98, tokenDataSource.RABBIT)
      // continue
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
