
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

/**
 * Get private key from .private-key to create a new wallet
 * If .private-key does not exists, create a new random wallet and write
 * the created wallet's private key to .private-key.
 */

const signer = testAccounts[0].wallet;
```
Here we are using a random wallet. Feel free to change to your own wallet using `.private-key` file.
```ts
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

const nativeToken = createERC20(NATIVE_ADDRESS_0x00, { provider });
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
  nonce: 457,
  maxPriorityFeePerGas: BigNumber { value: "1500000000" },
  maxFeePerGas: BigNumber { value: "150843284702" },
  gasPrice: null,
  gasLimit: BigNumber { value: "486527" },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { value: "50000000000000000" },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a0f48346e58cb100000000000000000000000000000000000000000000000000a0f48346e58cb1000000000000000000000000000000000000000000000000010c423020d3ea7d00000000000000000000000000000000000000000000000000b2d6cac08d46fe000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0x4a5bb476036c8e9595cfa9e2d7a336f07bfa479ce95fd510e2d154e6454a589d',
  v: 1,
  r: '0xb36b82588c43a3e980e2fc503b042b417d769cd91c765af2fa59f767bec1f6ac',
  s: '0x549eeae17a49cd962559e65f98427a09022707fa9e3e66b40ffb3694796728e1',
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
Pt balance of 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is 50299385037846408

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
  nonce: 458,
  maxPriorityFeePerGas: BigNumber { value: "1500000000" },
  maxFeePerGas: BigNumber { value: "141724506948" },
  gasPrice: null,
  gasLimit: BigNumber { value: "434512" },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { value: "50000000000000000" },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a0eacf7b57f98600000000000000000000000000000000000000000000000000a0eacf7b57f986000000000000000000000000000000000000000000000000010c3204783d4a8a00000000000000000000000000000000000000000000000000b2cc02fad38707000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0x91b2b71f41340ba2325e0af95298f0294c92b72cceaa7676f9ed322d1e341c78',
  v: 1,
  r: '0xda51ffd8c670970ad2e4a7fa5941da54acae58aa4be0ecd4b12faebba9c45400',
  s: '0x03b589c25b939127de28f0ce043791b77c2552508e3cf6184ea9aa24ff542b1d',
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
334487

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
{ netPtOut: '50327092333280423', netSyFee: '6174113908299' }

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
  netPtOut: '50327092333280423',
  netSyFee: '6174113908299',
  priceImpact: '479594055674'
}
{
  type: 2,
  chainId: 31337,
  nonce: 459,
  maxPriorityFeePerGas: BigNumber { value: "1500000000" },
  maxFeePerGas: BigNumber { value: "124627891018" },
  gasPrice: null,
  gasLimit: BigNumber { value: "434487" },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { value: "50000000000000000" },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a0eb005efe3cfc00000000000000000000000000000000000000000000000000a0eb005efe3cfc000000000000000000000000000000000000000000000000010c3255f3a7bafa00000000000000000000000000000000000000000000000000b2cc394d1a7ca7000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0x8397adcdf40dbb791d4334819809bbdc287bbceab23596d44d7143e70a9f6c80',
  v: 1,
  r: '0xf8b045ed0617da699719459938e1fdbfd40ef337515c95c51ffcec75ebd99176',
  s: '0x73f8a1e032da7ee63d504604eaa7db6159f804dd5e8c3921e4ef6a412a269b33',
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
