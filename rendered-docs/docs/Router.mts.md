
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

const provider = new providers.StaticJsonRpcProvider();

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


import { createERC20, NATIVE_ADDRESS_0xEE } from '@pendle/sdk-v2';

const nativeToken = createERC20(NATIVE_ADDRESS_0xEE, { provider });
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

function swapAvaxForPt(amount: BN, slippage: number) {
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
    const transaction = await swapAvaxForPt(amountToTrade, 0.1);
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
  nonce: 455,
  maxPriorityFeePerGas: BigNumber { _hex: '0x59682f00', _isBigNumber: true },
  maxFeePerGas: BigNumber { _hex: '0x0f9a2b8a62', _isBigNumber: true },
  gasPrice: null,
  gasLimit: BigNumber { _hex: '0x06e6c9', _isBigNumber: true },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { _hex: '0xb1a2bc2ec50000', _isBigNumber: true },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a11d60ce5b27aa00000000000000000000000000000000000000000000000000a11d60ce5b27aa000000000000000000000000000000000000000000000000010c864c0297ecc600000000000000000000000000000000000000000000000000b30432ac654884000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0xa8f7a64476e650b4658fd616ec375b1337dfded737466b050a9e0ad16f79b562',
  v: 0,
  r: '0x18836207e64ae82cc054121bb11708c631adaae193ed3dbec1be8d48f23656da',
  s: '0x4c91dd54748b71f90a33b3c342cad8ebdadf1e459327a19d0bca01a7a520cf91',
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
Pt balance of 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is 50388636518402180

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
  nonce: 456,
  maxPriorityFeePerGas: BigNumber { _hex: '0x59682f00', _isBigNumber: true },
  maxFeePerGas: BigNumber { _hex: '0x0eb370dfc6', _isBigNumber: true },
  gasPrice: null,
  gasLimit: BigNumber { _hex: '0x06a099', _isBigNumber: true },
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  value: BigNumber { _hex: '0xb1a2bc2ec50000', _isBigNumber: true },
  data: '0xa5f9931b000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000009ec4c502d989f04ffa9312c9d6e3f872ec91a0f900000000000000000000000000000000000000000000000000a11cdb59cdcb2d00000000000000000000000000000000000000000000000000a11cdb59cdcb2d000000000000000000000000000000000000000000000000010c856d95ac52a100000000000000000000000000000000000000000000000000b3039e63c83716000000000000000000000000000000000000000000000000000000000000000d00000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  accessList: [],
  hash: '0xeb099ac720ebb538b54f248a14132ad8df8135d2200db5346ba466e90ab66f2d',
  v: 1,
  r: '0xb816748b9d0dfaf936916b076db333299343340aa01cf3e9a6926852ff0615a3',
  s: '0x790e4057021879c81abd00c821b0e14ee7e6d652ca8b505b1fb6182b8ab2f1da',
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
334329

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
{ netPtOut: '50388071943759827', netSyFee: '7530350048500' }

```
### `meta-method` example

Beside the functionalities stated in the [ERC20 tutorial with Pendle SDK][ERC20-tutorial] article, `meta-method` can also be used to get the intermediate calculation result.

[erc20-tutorial]: ./erc20-tutorial.mts.md

In the case of [`swapExactTokenForPt`][Router-SwapExactTokenForPt], the result will have a field called `data`, which is an object that has the following fields:
- `input: TokenInputStruct` - the structure to pass to the [corresponding contract method](https://github.com/pendle-finance/pendle-core-internal-v2/blob/main/contracts/interfaces/IPActionSwapPT.sol#L55)
- `kybercallData: KybercallData` - the information about the route via KyberSwap
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
    console.log(`See on block explorer: https://testnet.snowtrace.io/tx/${transaction.hash}`);
  } catch (e) {
    console.error(e);
  }
}
```
Output:
```
{
  netPtOut: '50388071943759827',
  netSyFee: '7530350048500',
  priceImpact: '576336957168'
}
See on block explorer: https://testnet.snowtrace.io/tx/0xd984e7cb7fdc29f508bf419932868f67ab0e2e22626defb9edd0219dad086155

```