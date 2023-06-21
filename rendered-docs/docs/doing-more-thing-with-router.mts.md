---
hide_table_of_contents: true
---


# Doing more things with Pendle SDK Router

Pendle SDK is designed to not only make transaction, but also do a lot more,
such as getting gas estimation, getting parameters to call the corresponding
contract, and even getting the intermediate calculation results. 

Here is how we can do it.

## Preparation

Pendle SDK is built on top of [Ethers.js](https://docs.ethers.org/v5/) library.
To interact with the contract with Ethers.js, first we need to prepare two
things:

- A `provider`, which is a connection to the Ethereum network.
- A `signer`, which holds your private key and can sign things.

Typically, `provider` and `signer` that interact with the Ethereum network via
JSON-RPC can be created  as follows:

```ts
import ethers from 'ethers';

const jsonRpcUrl = 'your-json-rpc-url';
const privateKey = 'your-private-key';
const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
```

Please checkout the [documentation](https://docs.ethers.org/v5/getting-started) of
Ethers.js for the usage of `provider` and `signer`.

To demonstrate the usage of Pendle SDK, we will use a prepared `provider` and
some test accounts with filled balances in a local forked network. (Checkout
[playground.mts](../playground.mts.md) to see how they are created).

```ts
import ethers from 'ethers';
import { provider, testAccounts } from './playground.mjs';

{
    const address = testAccounts[0].address;
    const ethBalance = ethers.utils.formatEther(await testAccounts[0].wallet.getBalance());
    console.log('Test account info:', { address, ethBalance });
}
```

Output:

```
Test account info: {
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  ethBalance: '9999.984793785190352543'
}
```

## The magic `method` parameters.

Suppose that we want to add liquidity to the [PT stETH
Pool](https://app.pendle.finance/pro/pools/0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2/zap/in?chain=ethereum)
with 5 ETH. We can do it as follow.

```ts
import { toAddress, BN, NATIVE_ADDRESS_0x00 } from '@pendle/sdk-v2';
const ETH_DECIMALS = 18n;

const marketAddress = toAddress('0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2');
const tokenInAddress = NATIVE_ADDRESS_0x00;
const amountTokenIn = BN.from(5n * 10n ** ETH_DECIMALS);
const slippage = 0.2 / 100;
```



```ts
import { Router } from '@pendle/sdk-v2';

const router = Router.getRouter({
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});

const zapInTx = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage
);

await zapInTx.wait();
```

What if we want to estimate the gas consumption for this transaction. You can
pass in `{ method: 'estimateGas' }` as an additional parameters:

```ts
const estimatedGasConsumption = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'estimateGas'}  // <---------------- additional parameter here
);

console.log({ estimatedGasConsumption });
```

Output:

```
{ estimatedGasConsumption: BigNumber { value: "439265" } }
```

Please note that `estimatedGasConsumption` will have the type `BN` instead of
Ethersjs [ContractTransaction][ethers-TransactionResponse]. That is, **the return type is tied to
`method`**.  You can pass in the additional `{ method }` in most of the [Pendle
SDK Router][api-Router] function, and they will work as you expected.

The `method` parameter is also **typed**. It can not be an arbitrary string, but
should be one of the following value in the union [MetaMethodType][api-MetaMethodType].
Typescript compiler will ensure that you will not pass in a wrong value.

```ts
type MetaMethodType = 
    | "estimateGas"
    | "send"
    | "callStatic"
    | "multicallStatic";
    | "populateTransaction"
    | "extractParams"
    | "meta-method"
```

Let's explore the functionalities of each `method`.

### `estimateGas` method
We have demonstrated this method above.

### `send` method
This one is the default `method`. That is, if `method` is not passed in,
the function will make an transaction.

```ts
const zapInTxWithSendMethod = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'send' }
);

await zapInTxWithSendMethod.wait();
```

The result will have the type of [ContractTransaction][ethers-TransactionResponse].

### `callStatic` method
This method will return the result of the contract call, just like doing `callStatic`
instead of `send`.

```ts
const callStaticResult = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'callStatic' }
);

console.log(callStaticResult);
```

Output:

```
[
  BigNumber { value: "2471701523020473372" },
  BigNumber { value: "2141609068609255" },
  netLpOut: BigNumber { value: "2471701523020473372" },
  netSyFee: BigNumber { value: "2141609068609255" }
]
```

The return type of the function with `callStatic` method will have the return type of the corresponding
contract. In this case, the function calls the [RouterContract] method [pendle-contract-addLiquiditySingleToken].

### `multicallStatic` method

TODO

### `populateTransaction` method

If you want to get the populated transaction before sending, you can do as follows:

```ts
const populatedTransaction = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'populateTransaction' }
);

console.log(populatedTransaction);
```

Output:

```
{
  data: '0x015491d1000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000c374f7ec85f8c7de3207a10bb1978ba104bda3b2000000000000000000000000000000000000000000000000224475312e43ff160000000000000000000000000000000000000000000000000e868e65f25c44080000000000000000000000000000000000000000000000000eb344b21307b3260000000000000000000000000000000000000000000000000e8e021d4d238138000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000038d7ea4c68000000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004563918244f4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  to: '0x0000000001E4ef00d069e71d6bA041b0A16F7eA0',
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  value: BigNumber { value: "5000000000000000000" }
}
```

The return type will be Ethers.js [TransactionResponse][ethers-TransactionResponse]

### `extractParams` method
If you want to get the parameters for contract call, you can do as follows:

```ts
const paramsForContract = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'extractParams' }
);

console.log(paramsForContract);
```

Output:

```
[
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2',
  BigNumber { value: "2469227349795929878" },
  {
    guessMin: BigNumber { value: "1046680531919193096" },
    guessMax: BigNumber { value: "1059265868976337702" },
    guessOffchain: BigNumber { value: "1048778088095383864" },
    maxIteration: 7,
    eps: '1000000000000000'
  },
  {
    tokenIn: '0x0000000000000000000000000000000000000000',
    netTokenIn: BigNumber { value: "5000000000000000000" },
    tokenMintSy: '0x0000000000000000000000000000000000000000',
    bulk: '0x0000000000000000000000000000000000000000',
    pendleSwap: '0x0000000000000000000000000000000000000000',
    swapData: {
      swapType: 0,
      extRouter: '0x0000000000000000000000000000000000000000',
      extCalldata: [],
      needScale: false
    }
  },
  { value: BigNumber { value: "5000000000000000000" } }
]
```

The return type will be a tuple, which is the list of parameters to be passed to
the corresponding contract if you are using Ethers.js. Note that the `overrides`
field is also returned. In this case, the function calls the [RouterContract]
method [pendle-contract-addLiquiditySingleToken].

### The `meta-method` method

This is the powerful method of Pendle SDK.

```ts
const metaMethod = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'meta-method' }
);
```

The result of the function with `meta-method` method will be [ContractMetaMethod][api-ContractMetaMethod].
This object hold the intermediate calculation result, as well as do many other things.

The intermediate calculation result can obtained via `.data` property.

```ts
const { netLpOut, priceImpact } = metaMethod.data;
console.log({ netLpOut, priceImpact });
```

Output:

```
{
  netLpOut: BigNumber { value: "2471701523020473372" },
  priceImpact: BigNumber { value: "28626438714961" }
}
```

This property is also **typed**. You can refer to the API reference to see the type of `.data`.
For this function, please see [Router#addLiquiditySingleToken][api-Router-addLiquiditySingleToken].

```ts
addLiquiditySingleToken<T>(market, tokenIn, netTokenIn, slippage, _params?):
    RouterMetaMethodReturnType<
        T, "addLiquiditySingleToken",
        BaseZapInRouteData & {
            exchangeRateAfter: BN;
            minLpOut: BN;
            netLpOut: BN;
            netPtFromSwap: BN;
            netSyFee: BN;
            netSyMinted: BN;
            netSyToSwap: BN;
            priceImpact: BN;
            route: AddLiquiditySingleTokenRoute<T>;
        }
    >
```

The property `metaMethod.data` will have the type:

```ts
    BaseZapInRouteData & {
        exchangeRateAfter: BN;
        minLpOut: BN;
        netLpOut: BN;
        netPtFromSwap: BN;
        netSyFee: BN;
        netSyMinted: BN;
        netSyToSwap: BN;
        priceImpact: BN;
        route: AddLiquiditySingleTokenRoute<T>;
    }
```

With this, you can additional information, such as `priceImpact` or `exchangeRateAfter`.

`metaMethod` also _packed_ with all of the above methods. That is, `metaMethod` can be used
to send transaction, estimate gas, extract parameters, ... **WITHOUT** any recalculation.

```ts
{
    const callStaticResult = await metaMethod.callStatic();
    const gasEstimation = await metaMethod.estimateGas();
    const extractedParams = await metaMethod.extractParams();
    console.log({ callStaticResult, gasEstimation, extractedParams });

    const tx = await metaMethod.send();
    await tx.wait();
}
```

Output:

```
{
  callStaticResult: [
    BigNumber { value: "2471701523020473372" },
    BigNumber { value: "2141609068609255" },
    netLpOut: BigNumber { value: "2471701523020473372" },
    netSyFee: BigNumber { value: "2141609068609255" }
  ],
  gasEstimation: BigNumber { value: "439265" },
  extractedParams: [
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    '0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2',
    BigNumber { value: "2469227349795929878" },
    {
      guessMin: BigNumber { value: "1046680531919193096" },
      guessMax: BigNumber { value: "1059265868976337702" },
      guessOffchain: BigNumber { value: "1048778088095383864" },
      maxIteration: 7,
      eps: '1000000000000000'
    },
    {
      tokenIn: '0x0000000000000000000000000000000000000000',
      netTokenIn: BigNumber { value: "5000000000000000000" },
      tokenMintSy: '0x0000000000000000000000000000000000000000',
      bulk: '0x0000000000000000000000000000000000000000',
      pendleSwap: '0x0000000000000000000000000000000000000000',
      swapData: [Object]
    },
    { value: BigNumber { value: "5000000000000000000" } }
  ]
}
```

[api-MetaMethodType]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/types/MetaMethodType.html
[api-Router]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/classes/Router.html
[api-Router-addLiquiditySingleToken]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/classes/Router.html#addLiquiditySingleToken
[api-ContractMetaMethod]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/classes/ContractMetaMethod.html
[RouterContract]: https://etherscan.io/address/0x0000000001e4ef00d069e71d6ba041b0a16f7ea0#code
[pendle-contract-addLiquiditySingleToken]: https://github.com/pendle-finance/pendle-core-v2-public/blob/310bcc9e419b2122eaf65fd283f809023ceddae6/contracts/router/ActionAddRemoveLiq.sol#L209
[ethers-TransactionResponse]: https://docs.ethers.org/v5/api/providers/types/#providers-TransactionResponse
[ethers-UnsignedTransaction]: https://docs.ethers.org/v5/api/utils/transactions/#UnsignedTransaction
