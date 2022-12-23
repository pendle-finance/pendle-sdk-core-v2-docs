# Pendle SDK `Router`

---

`Router` is the main feature of Pendle SDK. It handles all the trading logic while ensuring the user will receive the optimal amount after trades. It also returns the intermediate results, allowing us to do further calculations.

## Getting started

### Create a router instance

Suppose that we want to create a router on Fuji testnet (with chain id of `43113`). 

```typescript
const chainId = 43113;
```

First, we need to have a `Signer` and/or a `Provider`. Most of the time, `Signer` can be used. But when sending transaction is not required, `Provider` can be used too (with `WrappedContract`'s meta-method `'callStatic'`, `'multicallStatic'`, `'estimateGas'`, and especially `'meta-method'`). 

```typescript
import { getDefaultProvider, Wallet, providers } from 'ethers';

const providerUrl = 'https://api.avax-test.network/ext/bc/C/rpc'
const provider = getDefaultProvider(providerUrl);
```

```typescript
import { Wallet, providers } from 'ethers';
import { promises as fs } from 'fs';

/**
 * Get private key from .private-key to create a new wallet
 * If .private-key does not exists, create a new random wallet and write
 * the created wallet's private key to .private-key.
 */
async function getWallet(provider: providers.Provider) {
    try {
        const privateKey = await fs.readFile('.private-key', 'utf8');
        return new Wallet(privateKey, provider);
    } catch {
        const randomSigner = Wallet.createRandom().connect(provider);
        await fs.writeFile('.private-key', randomSigner.privateKey);
        return randomSigner;
    }
}

const signer = await getWallet(provider);
```

Here we are using a random wallet. Feel free to change to your own wallet using `.private-key` file.

```typescript
import { toAddress } from '@pendle/sdk-v2';
const signerAddress = toAddress(signer.address);
signerAddress
```

Outputs:

<pre><code><span style="color:#0A0">'0xc9871ed8fe3f8b445d7b8b12388b9f9b8542e71d'<span style="color:#FFF"></span></span>
</code></pre><br>

Then we can create a `Router` instance as follows:

```typescript
import { Router } from '@pendle/sdk-v2';

const router = Router.getRouter({ chainId, signer });
```

## Example: swap from known amount of token to PT

Before doing any action, we should first have an address of a Pendle Market to interact with. [Pendle Backend][Pendle-Backend] can be used to obtain the whitelisted markets. For demonstration, we are going to use the following market:

<!-- TODO update docs link -->
[Pendle-Backend]: https://staging-api.pendle.finance/core/graphql

```typescript
import { toAddress } from '@pendle/sdk-v2';
const marketAddress = toAddress('0x0e303bbd4f9f316c797aaedc71ebe7342a5269c6');
```

Since our signer is random, we need to fund ourselves first using the [AVAX faucet]. We can also check our balance also with Pendle SDK.

[AVAX faucet]: https://faucet.avax.network/

```typescript
import { createERC20, NATIVE_ADDRESS_0xEE } from '@pendle/sdk-v2';

const nativeToken = createERC20(NATIVE_ADDRESS_0xEE, { provider });
console.log(`balance of ${signerAddress} is ${String(await nativeToken.balanceOf(signer.address))}`);
```

Outputs:

<pre><code>balance of 0xc9871ed8fe3f8b445d7b8b12388b9f9b8542e71d is 1746292450000000000

</code></pre><br>

Now suppose we want to trade some AVAX to the market's PT token. We can use `Router`'s [`swapExactTokenForPt`][Router-SwapExactTokenForPt] method as follows:

[Router-SwapExactTokenForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactTokenForPt

```typescript
import { BN, NATIVE_ADDRESS_0x00 } from '@pendle/sdk-v2';

function swapAvaxForPt(amount: BN, slippage: number) {
    return router.swapExactTokenForPt(
        marketAddress,
        NATIVE_ADDRESS_0x00,    // token address
        amount,                 // token amount
        slippage,
    );
}
```

For example, if we want to trade `0.05` AVAX with `0.1%` slippage.

```typescript
const amountToTrade = BN.from(10).pow((await nativeToken.decimals()) - 2).mul(5);  // 0.05 token

try {
    const transaction = await swapAvaxForPt(amountToTrade, 0.1);
    console.log(`See on block explorer: https://testnet.snowtrace.io/tx/${transaction.hash}`);
} catch (e) {
    console.error(e);
}
```

Outputs:

<pre><code>NoRouteFoundError: No route found to swap from 0x0000000000000000000000000000000000000000 to 0xb7a1e3afa053e2ff4b525900b3359749beab101f
    at Function.action (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/errors.ts:50:16)
    at /home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/entities/Router.ts:868:37
    at Generator.next (<anonymous>)
    at asyncGeneratorStep (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/dist/sdk-v2.cjs.development.js:54:24)
    at _next (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/dist/sdk-v2.cjs.development.js:73:9)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)

</code></pre><br>

Let's check the PT balance:

```typescript
import { MarketEntity } from '@pendle/sdk-v2';

const marketEntity = new MarketEntity(marketAddress, { provider, chainId });
const ptEntity = await marketEntity.ptEntity();
const ptBalance = await ptEntity.balanceOf(signerAddress);

console.log(`Pt balance of ${signerAddress} is ${String(ptBalance)}`);
```

Outputs:

<pre><code>Pt balance of 0xc9871ed8fe3f8b445d7b8b12388b9f9b8542e71d is 0

</code></pre><br>

Congratulation, we are now a PT token holder!

### Which token can be used with `Router`?

In the above example we only use `AVAX` to demonstrate the usage of the `Router`. But we can use **arbitrary token** in place of `AVAX`! 

In Pendle, there are tokens that are _base tokens_, which can be used to mint `Sy`, or redeem from `Sy`. Internally, _base tokens_ are used to perform operations. And to work with **arbitrary tokens**, Pendle uses [KyberSwap] to swap between arbitrary tokens and _base tokens_.

[KyberSwap]: https://kyberswap.com/

## Additional feature of `Router`'s method

As in [ERC 20 tutorial with Pendle SDK][erc20-tutorial] article, `{ method: ... }` can be passed in a write function. We can do the same for `Router`!

[erc20-tutorial]: ./erc20-tutorial.md

### `send` example

`send` is the default method. It will send the transaction, the same way as we did with the function `swapAvaxForPt`.

```typescript
const amount = amountToTrade;
const slippage = 0.1;

try {
    const transaction = await router.swapExactTokenForPt(marketAddress, NATIVE_ADDRESS_0x00, amount, slippage);
    console.log(`See on block explorer: https://testnet.snowtrace.io/tx/${transaction.hash}`);
} catch (e) {
    console.error(e);
}
```

Outputs:

<pre><code>NoRouteFoundError: No route found to swap from 0x0000000000000000000000000000000000000000 to 0x4cfe3ab9cf4bda9b668497e373baa00e875f722c
    at Function.action (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/errors.ts:50:16)
    at /home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/entities/Router.ts:868:37
    at Generator.next (<anonymous>)
    at asyncGeneratorStep (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/dist/sdk-v2.cjs.development.js:54:24)
    at _next (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/dist/sdk-v2.cjs.development.js:73:9)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)

</code></pre><br>

### `estimateGas` example

This method can be used to estimate the gas to transaction.

```typescript
const amount = amountToTrade;
const slippage = 0.1;
const gasUsed = await router.swapExactTokenForPt(
    marketAddress, NATIVE_ADDRESS_0x00, amount, slippage,
    { method: 'estimateGas' }
).then(String); // cast ethersjs' BigNumber to String for readability.

console.log(gasUsed);
```

Outputs:

### `callStatic` example

This method can be used to ask a Node to calculate the hypothetical result of the contract call, without sending an actual transaction.

```typescript
const amount = amountToTrade;
const slippage = 0.1;

const { netPtOut, netSyFee } = await router.swapExactTokenForPt(
    marketAddress, NATIVE_ADDRESS_0x00, amount, slippage,
    { method: 'callStatic' }
);

console.log({
    netPtOut: netPtOut.toString(),
    netSyFee: netSyFee.toString()
});
```

Outputs:

<pre><code>{ netPtOut: '50628212485603867', netSyFee: '247673' }

</code></pre><br>

### `meta-method` example

Beside the functionalities stated in the [ERC20 tutorial with Pendle SDK][ERC20-tutorial] article, `meta-method` can also be used to get the intermediate calculation result.

[erc20-tutorial]: ./erc20-tutorial.md

In the case of [`swapExactTokenForPt`][Router-SwapExactTokenForPt], the result will have a field called `data`, which is an object that has the following fields:
- `input: TokenInputStruct` - the structure to pass to the [corresponding contract method](https://github.com/pendle-finance/pendle-core-internal-v2/blob/main/contracts/interfaces/IPActionSwapPT.sol#L55)
- `kybercallData: KybercallData` - the information about the route via KyberSwap
- `netPtOut: BN;` - the hypothetical amount of `pt` can be received.
- `netSyFee: BN;` - the hypothetical fee, in `SY`.
- `priceImpact: BN;` the hypothetical price impact. 

[Router-SwapExactTokenForPt]: http://playground.pendle.finance/sdk-docs/classes/Router.html#swapExactTokenForPt

```typescript
const amount = amountToTrade;
const slippage = 0.1;

const metaMethod = await router.swapExactTokenForPt(
    marketAddress, NATIVE_ADDRESS_0x00, amount, slippage,
    { method: 'meta-method' }
);

// getting the interesting data:
const { input, kybercallData, netPtOut, netSyFee, priceImpact } = metaMethod.data;

console.log({
    input,
    kybercallData,
    netPtOut: netPtOut.toString(),
    netSyFee: netSyFee.toString(),
    priceImpact: priceImpact.toString()
});

// Send transaction with metaMethod:

try {
    const transaction = await metaMethod.send();
    console.log(`See on block explorer: https://testnet.snowtrace.io/tx/${transaction.hash}`);
} catch (e) {
    console.error(e);
}
```

Outputs:

<pre><code>{
  input: {
    tokenIn: '0x0000000000000000000000000000000000000000',
    netTokenIn: BigNumber { _hex: '0xb1a2bc2ec50000', _isBigNumber: true },
    tokenMintSy: '0x0000000000000000000000000000000000000000',
    kybercall: [],
    bulk: '0x0000000000000000000000000000000000000000',
    kyberRouter: '0x0000000000000000000000000000000000000000'
  },
  kybercallData: {
    outputAmount: BigNumber { _hex: '0xb1a2bc2ec50000', _isBigNumber: true },
    encodedSwapData: [],
    routerAddress: '0x0000000000000000000000000000000000000000'
  },
  netPtOut: '50608286682552314',
  netSyFee: '247634',
  priceImpact: '4402027275017525'
}
See on block explorer: https://testnet.snowtrace.io/tx/0xf8a84c34855dabe664854f08a6f71792e6cfd9e1aa15c633742eca71771795f2

</code></pre><br>

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