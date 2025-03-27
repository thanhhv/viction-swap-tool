import { ethers } from 'ethers';

export async function getQuote(
  swapper,
  tokenInAddress,
  tokenOutAddress,
  amountIn
) {
  const response = await fetch('https://api.rabbitswap.xyz/quote', {
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      tokenInChainId: 88,
      tokenIn: tokenInAddress,
      tokenOutChainId: 88,
      tokenOut: tokenOutAddress,
      type: 'EXACT_INPUT',
      amount: amountIn.toString(),
      slippageTolerance: '0.5',
      deadline: 600,
      swapper,
      withPoolFee: true
    }),
    method: 'POST'
  });
  const quote = await response.json();
  console.log(`[getQuote] success`);

  return quote;
}

export async function approveToken(tokenIn, uniswapRouter, signer) {
  try {
    // check contract approved token
    const erc20 = new ethers.Contract(tokenIn, [
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) public returns (bool)"
    ], signer);

    const allowance = await erc20.allowance(signer.address, uniswapRouter);
    // console.log("Allowance:", allowance.toString());

    const isApprove = allowance.toString()
    if (isApprove === '0') {
      // approve token
      const approveTx = await erc20.approve(uniswapRouter, ethers.constants.MaxUint256);
      await approveTx.wait();
      console.log("Token approved!");
    }
  } catch (error) {
    console.error(`[approveToken] Error`, error)
  }
}

export async function swap(quote, uniswapRouter, signer) {
  try {
    const { methodParameters } = quote
    const tx = await signer.sendTransaction({
      to: uniswapRouter,
      data: methodParameters.data,
      value: methodParameters.value
    });

    console.log("[swap] Transaction sent! Tx Hash:", tx.hash);
    // waiting for transaction
    const receipt = await tx.wait();

    // check tx
    if (receipt.status === 1) {
      console.log("[swap] ✅ Transaction succeeded!", receipt.transactionHash);
    } else {
      console.error("[swap] ❌ Transaction failed!", receipt);
    }
  } catch (error) {
    console.error(`[swap] Error`, error)
  }
}

export async function getTokenBalance(walletAddress, tokenAddress, provider) {
  const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
  ];

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await tokenContract.balanceOf(walletAddress);

  return balance;
}
