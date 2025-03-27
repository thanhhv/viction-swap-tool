# Viction Swap Tool

## Overview
This repository contains a Node.js tool for swapping assets using predefined private keys. The process ensures that funds always remain in a designated wallet for tracking purposes.

## Requirements
- Node.js v20

## Environment Variables
Set the following environment variable before running the tool:

- `PRIVATE_KEYS`: A comma-separated list of private keys, e.g.,
  ```
  PRIVATE_KEYS=0xPrivateKey1,0xPrivateKey2,...
  ```

## Execution
To run the tool, use:
```sh
npm start
```

## Wallet Flow
When the tool runs for the first time, it creates a file named `current-wallet-has-money.txt`. This file stores the address of the wallet currently holding the funds.

The process follows this sequence:
1. Swap is performed using the first wallet.
2. After the swap, all funds from this wallet are transferred to the wallet address stored in `current-wallet-has-money.txt`.
3. Funds from this designated wallet are then transferred to the next wallet in the sequence.
4. This cycle continues, ensuring that funds always pass through a single tracking wallet.

This mechanism helps in monitoring fund movements and ensures that assets are always centralized in one wallet before the next swap.

