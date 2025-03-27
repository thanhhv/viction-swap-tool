import { ethers } from "ethers"

export async function transferToken(fromWallet, toWallet, amountInWei, tokenAddress) {
  try {
    if (amountInWei <= 0) {
      console.log(`[transferToken] stop because amount = 0`)
      return
    }
    const erc20Abi = [
      "function transfer(address to, uint256 amount) public returns (bool)",
      "function decimals() public view returns (uint8)"
    ];
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, fromWallet);

    // Gửi token
    const tx = await tokenContract.transfer(toWallet, amountInWei);
    console.log("[transferToken] ✅ Transaction sent! Tx Hash:", tx.hash);

    // Chờ xác nhận giao dịch
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("[transferToken] ✅ Transfer succeeded!", receipt.transactionHash);
    } else {
      console.error("[transferToken] ❌ Transfer failed!", receipt);
    }
  } catch (error) {
    throw("❌ Error transferring token:", error)
  }
}