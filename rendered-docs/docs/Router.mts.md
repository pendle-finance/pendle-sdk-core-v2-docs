
# Pendle SDK `Router`

---

`Router` is the main feature of Pendle SDK. It handles all the trading logic while ensuring the user will receive the optimal amount after trades. It also returns the intermediate results, allowing us to do further calculations.

## Getting started

### Create a router instance

Suppose that we want to create a router on Ethereum mainnet (with chain id of `1`).
```ts
const chainId = 1;
```
First, we need to have a `Signer` and/or a `Provider`. Most of the time, `Signer` can be used. But when sending transaction is not required, `Provider` can be used too (with `WrappedContract`'s meta-method `'callStatic'`, `'multicallStatic'`, `'estimateGas'`, and especially `'meta-method'`).
```ts
import { Wallet, providers } from 'ethers';

import { provider, testAccounts } from './playground.mjs';

import { promises as fs } from 'fs';

const signer = testAccounts[0].wallet;

import { toAddress } from '@pendle/sdk-v2';
const signerAddress = toAddress(signer.address);
console.log(signerAddress);
```
Output:
```
0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

```
Then we can create a `Router` instance as follows:
```ts
import { Router } from '@pendle/sdk-v2';

const router = Router.getRouterWithKyberAggregator({chainId, signer});
```
## Example: swap from known amount of token to PT

Before doing any action, we should first have an address of a Pendle Market to interact with. [Pendle Backend][Pendle-Backend] can be used to obtain the whitelisted markets. For demonstration, we are going to use the following market:

<!-- TODO update docs link -->
[Pendle-Backend]: https://api-v2.pendle.finance/core/docs
```ts
const marketAddress = toAddress('0x9ec4c502d989f04ffa9312c9d6e3f872ec91a0f9');


import { createERC20 } from '@pendle/sdk-v2';

const nativeToken = createERC20(NATIVE_ADDRESS_0x00, { provider, chainId });
console.log(`balance of ${signerAddress} is ${String(await nativeToken.balanceOf(toAddress(signer.address)))}`);
```
Output:
```
balance of 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is 10000000000000000000000

```
Now suppose we want to trade some ETH to the market's PT token. We can use `Router`'s [`swapExactTokenForPt`][Router-SwapExactTokenForPt] method as follows:

[Router-SwapExactTokenForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactTokenForPt
```ts
import { BN, NATIVE_ADDRESS_0x00 } from '@pendle/sdk-v2';

function swapNativeForPt(amount: BN, slippage: number) {
    return router.swapExactTokenForPt(
        marketAddress,
        NATIVE_ADDRESS_0x00,    // token address
        amount,                 // token amount
        slippage,
    );
}
```
For example, if we want to trade `0.05` ETH with `0.1%` slippage.
```ts
const amountToTrade = BN.from(10).pow((await nativeToken.decimals()) - 2).mul(5);  // 0.05 token

try {
    const transaction = await swapNativeForPt(amountToTrade, 0.1);
    console.log(transaction);
} catch (e) {
    console.error(e);
}
```
Output:
```
{
  type: 2,
  chainId: 31337,
  nonce: 458,
  maxPriorityFeePerGas: BigNumber { value: "1500000000" },
  maxFeePerGas: BigNumber { value: "173533370596" },
  gasPrice: null,
  gasLimit: BigNumber { value: "452203" },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { value: "50000000000000000" },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a1050e3524189500000000000000000000000000000000000000000000000000a1050e35241895000000000000000000000000000000000000000000000000010c5dc258917e4f00000000000000000000000000000000000000000000000000b2e92c3b0ba98a000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0x0f0ddae6139f25689f165a7ea850355803fa31fcf79e00d9b14f78f030f72a28',
  v: 0,
  r: '0x349169f33b58744b96154ef47ef87e18cdcb4dd04bdce59f1cdbf9632d429676',
  s: '0x562fba53be4114c5104260e76aa7e09eadc3f2085e547efe0ed0be6874f8fa1b',
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  confirmations: 0,
  wait: [Function (anonymous)]
}

```
Let's check the PT balance:
```ts
import { MarketEntity } from '@pendle/sdk-v2';

const marketEntity = new MarketEntity(marketAddress, { provider, chainId });
const ptEntity = await marketEntity.ptEntity();
const ptBalance = await ptEntity.balanceOf(signerAddress);

console.log(`Pt balance of ${signerAddress} is ${String(ptBalance)}`);
```
Output:
```
Pt balance of 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is 50358922032949642

```
Congratulation, we are now a PT token holder!

### Which token can be used with `Router`?

In the above example we only use `ETH` to demonstrate the usage of the `Router`. But we can use **arbitrary token** in place of `ETH`! 

In Pendle, there are tokens that are _base tokens_, which can be used to mint `Sy`, or redeem from `Sy`. Internally, _base tokens_ are used to perform operations. And to work with **arbitrary tokens**, Pendle uses [KyberSwap] to swap between arbitrary tokens and _base tokens_.

[KyberSwap]: https://kyberswap.com/

## Additional feature of `Router`'s method

As in [ERC 20 tutorial with Pendle SDK][erc20-tutorial] article, `{ method: ... }` can be passed in a write function. We can do the same for `Router`!

[erc20-tutorial]: ./erc20-tutorial.mts.md
```ts
const amount = amountToTrade;
const slippage = 0.1;
```
### `send` example

`send` is the default method. It will send the transaction, the same way as we did with the function `swapAvaxForPt`.
```ts
try {
    const transaction = await router.swapExactTokenForPt(marketAddress, NATIVE_ADDRESS_0x00, amount, slippage);
    console.log(transaction);
} catch (e) {
    console.error(e);
}
```
Output:
```
{
  type: 2,
  chainId: 31337,
  nonce: 459,
  maxPriorityFeePerGas: BigNumber { value: "1500000000" },
  maxFeePerGas: BigNumber { value: "189620153734" },
  gasPrice: null,
  gasLimit: BigNumber { value: "434245" },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { value: "50000000000000000" },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a10618326cb0e000000000000000000000000000000000000000000000000000a10618326cb0e0000000000000000000000000000000000000000000000000010c5f7da95fd17500000000000000000000000000000000000000000000000000b2ea53c63fe0f9000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0x98c6f4d2c51c4fe5ad980d5bded01ea64cc1fa28499d590502ff2676e0a750c6',
  v: 1,
  r: '0x402447be10d1d3d785244f6bd4d1fe0204c4af63464f1faf7dbe9984b27bb3e1',
  s: '0x77120d4da610014c24dc5cd173003fb322f21d197840834de663f8e9aff3adfd',
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  confirmations: 0,
  wait: [Function (anonymous)]
}

```
### `estimateGas` example

This method can be used to estimate the gas to transaction.
```ts
const gasUsed = await router.swapExactTokenForPt(
    marketAddress, NATIVE_ADDRESS_0x00, amount, slippage,
    { method: 'estimateGas' }
).then(String); // cast ethersjs' BigNumber to String for readability.

console.log(gasUsed);
```
Output:
```
334245

```
### `callStatic` example

This method can be used to ask a Node to calculate the hypothetical result of the contract call, without sending an actual transaction.
```ts
const { netPtOut, netSyFee } = await router.swapExactTokenForPt(
    marketAddress, NATIVE_ADDRESS_0x00, amount, slippage,
    { method: 'callStatic' }
);

console.log({
    netPtOut: netPtOut.toString(),
    netSyFee: netSyFee.toString()
});
```
Output:
```
{ netPtOut: '50361465869261937', netSyFee: '6081982824736' }

```
### `meta-method` example

Beside the functionalities stated in the [ERC20 tutorial with Pendle SDK][ERC20-tutorial] article, `meta-method` can also be used to get the intermediate calculation result.

[erc20-tutorial]: ./erc20-tutorial.mts.md

In the case of [`swapExactTokenForPt`][Router-SwapExactTokenForPt], the result will have a field called `data`, which is an object that has the following fields:
- `netPtOut: BN;` - the hypothetical amount of `pt` can be received.
- `netSyFee: BN;` - the hypothetical fee, in `SY`.
- `priceImpact: BN;` the hypothetical price impact. 

[Router-SwapExactTokenForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactTokenForPt
```ts
{
  const metaMethod = await router.swapExactTokenForPt(
    marketAddress, NATIVE_ADDRESS_0x00, amount, slippage,
    { method: 'meta-method' }
  );
  
  // getting the interesting data:
  const { netPtOut, netSyFee, priceImpact } = metaMethod.data;

  console.log({
    netPtOut: netPtOut.toString(),
    netSyFee: netSyFee.toString(),
    priceImpact: priceImpact.toString()
  });

  // Send transaction with metaMethod:

  try {
    const transaction = await metaMethod.send();
    console.log(transaction);
  } catch (e) {
    console.error(e);
  }
}
```
Output:
```
{
  netPtOut: '50361465869261937',
  netSyFee: '6081982824736',
  priceImpact: '467398396229'
}
{
  type: 2,
  chainId: 31337,
  nonce: 460,
  maxPriorityFeePerGas: BigNumber { value: "1500000000" },
  maxFeePerGas: BigNumber { value: "166630590164" },
  gasPrice: null,
  gasLimit: BigNumber { value: "434245" },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { value: "50000000000000000" },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a1072343279fff00000000000000000000000000000000000000000000000000a1072343279fff000000000000000000000000000000000000000000000000010c613ac5420aa900000000000000000000000000000000000000000000000000b2eb7c83815c71000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0xd2cf61899984393dc0b6fcafd9dcc550acfcf35e5128c81a68385ecf8efdc86d',
  v: 1,
  r: '0x040b21c8ff2a7f8abebe83799ec6070ff0e05c478c1e5eb9277bf6709d986422',
  s: '0x57e2732c23d52c1e2ef3a63436f236d2da2576342a3401f517028246b5ef67d4',
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  confirmations: 0,
  wait: [Function (anonymous)]
}

```
## Methods of `Router`

### Swap **exact** `X` for `Y`

|            | to Token              | to Pt                 | to  Yt                | to Sy              |
| ---------- | --------------------- | --------------------- | --------------------- | ------------------ |
| from Token | x                     | [swapExactTokenForPt] | [swapExactTokenForYt] |                    |
| from Pt    | [swapExactPtForToken] | x                     | [swapExactPtForYt]    | [swapExactPtForSy] |
| from Yt    | [swapExactYtForToken] | [swapExactYtForPt]    | x                     | [swapExactYtForSy] |
| from Sy    |                       | [swapExactSyForPt]    | [swapExactSyForYt]    | x                  |

[swapExactPtForSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactPtForSy
[swapExactPtForToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactPtForToken
[swapExactPtForYt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactPtForYt

[swapExactSyForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactSyForPt
[swapExactSyForYt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactSyForYt

[swapExactTokenForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactTokenForPt
[swapExactTokenForYt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactTokenForYt

[swapExactYtForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactYtForPt
[swapExactYtForSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactYtForSy
[swapExactYtForToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactYtForToken


For swapping between token and `sy`, see [mintSyFromToken] and [redeemSyToToken].

[mintSyFromToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#mintSyFromToken
[redeemSyToToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#redeemSyToToken

### Swap `X` for **exact** `Y`

|            | to Token | to Pt              | to  Yt             | to Sy              |
| ---------- | -------- | ------------------ | ------------------ | ------------------ |
| from Token | x        | x                  | x                  | x                  |
| from Pt    | x        | x                  | x                  | [swapPtForExactSy] |
| from Yt    | x        | x                  | x                  | [swapYtForExactSy] |
| from Sy    | X        | [swapSyForExactPt] | [swapSyForExactYt] | x                  |

[swapPtForExactSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapPtForExactSy
[swapSyForExactPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapSyForExactPt
[swapSyForExactYt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapSyForExactYt
[swapYtForExactSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapYtForExactSy


### Mint `X` from `Y`

- [mintPyFromSy]
- [mintPyFromToken]
- [mintSyFromToken]

[mintPyFromSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#mintPyFromSy
[mintPyFromToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#mintPyFromToken
[mintSyFromToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#mintSyFromToken

### Redeem `X` to `Y`

- [redeemPyToSy]
- [redeemPyToToken]
- [redeemSyToToken]

[redeemPyToSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#redeemPyToSy
[redeemPyToToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#redeemPyToToken
[redeemSyToToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#redeemSyToToken

### Add liquidity to a pool with dual tokens

- [addLiquidityDualSyAndPt]
- [addLiquidityDualTokenAndPt]

[addLiquidityDualSyAndPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#addLiquidityDualSyAndPt
[addLiquidityDualTokenAndPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#addLiquidityDualTokenAndPt

### Add liquidity to a pool with single token

- [addLiquiditySinglePt]
- [addLiquiditySingleToken]
- [addLiquiditySingleSy]

[addLiquiditySinglePt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#addLiquiditySinglePt
[addLiquiditySingleToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#addLiquiditySingleToken
[addLiquiditySingleSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#addLiquiditySingleSy

### Remove liquidity from a pool with dual tokens

- [removeLiquidityDualSyAndPt]
- [removeLiquidityDualTokenAndPt]

[removeLiquidityDualSyAndPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#removeLiquidityDualSyAndPt
[removeLiquidityDualTokenAndPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#removeLiquidityDualTokenAndPt

### Remove liquidity from a pool with single token

- [removeLiquiditySinglePt]
- [removeLiquiditySingleToken]
- [removeLiquiditySingleSy]

[removeLiquiditySinglePt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#removeLiquiditySinglePt
[removeLiquiditySingleToken]: http://playground.pendle.finance/sdk-docs/classes/Router.html#removeLiquiditySingleToken
[removeLiquiditySingleSy]: http://playground.pendle.finance/sdk-docs/classes/Router.html#removeLiquiditySingleSy
