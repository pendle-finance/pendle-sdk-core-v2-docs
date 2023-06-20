/* ===
# Doing more things with Pendle SDK Router

Pendle SDK is designed to not only make transaction, but also do a lot more,
such as getting gas estimation, getting parameters to call the corresponding
contract, and even getting the intermediate calculation results. 

Here is how we can do it.
=== */

/* ===
## Preparation
=== */

//// { "include": "./common/prepare-provider-and-signer.mts" }
/// <reference path="./common/prepare-provider-and-signer.d.ts" />

/* ===
## The magic `method` parameters.

Suppose that we want to add liquidity to the [PT stETH
Pool](https://app.pendle.finance/pro/pools/0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2/zap/in?chain=ethereum)
with 5 ETH. We can do it as follow.

=== */

import { toAddress, BN, NATIVE_ADDRESS_0x00 } from '@pendle/sdk-v2';
const ETH_DECIMALS = 18n;

const marketAddress = toAddress('0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2');
const tokenInAddress = NATIVE_ADDRESS_0x00;
const amountTokenIn = BN.from(5n * 10n ** ETH_DECIMALS);
const slippage = 0.2 / 100;

/* ===
=== */

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

/* ===
What if we want to estimate the gas consumption for this transaction. You can
pass in `{ method: 'estimateGas' }` as an additional parameters:
=== */

const estimatedGasConsumption = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'estimateGas'}  // <---------------- additional parameter here
);

console.log({ estimatedGasConsumption });

/* ===
Please note that `estimatedGasConsumption` will have the type `BN` instead of
Ethersjs [ContractTransaction][ethers-TransactionResponse]. That is, **the return type is tied to
`method`**.  You can pass in the additional `{ method }` in most of the [Pendle
SDK Router][api-Router] function, and they will work as you expected.
=== */

/* ===
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
=== */

/* ===
### `estimateGas` method
We have demonstrated this method above.
=== */

/* ===
### `send` method
This one is the default `method`. That is, if `method` is not passed in,
the function will make an transaction.
=== */

const zapInTxWithSendMethod = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'send' }
);

await zapInTxWithSendMethod.wait();

/* ===
The result will have the type of [ContractTransaction][ethers-TransactionResponse].
=== */

/* ===
### `callStatic` method
This method will return the result of the contract call, just like doing `callStatic`
instead of `send`.
=== */

const callStaticResult = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'callStatic' }
);

console.log(callStaticResult);

/* ===
The return type of the function with `callStatic` method will have the return type of the corresponding
contract. In this case, the function calls the [RouterContract] method [pendle-contract-addLiquiditySingleToken].
=== */

/* ===
### `multicallStatic` method

TODO
=== */

/* ===
### `populateTransaction` method

If you want to get the populated transaction before sending, you can do as follows:
=== */

const populatedTransaction = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'populateTransaction' }
);

console.log(populatedTransaction);

/* ===
The return type will be Ethers.js [TransactionResponse][ethers-TransactionResponse]
=== */

/* ===
### `extractParams` method
If you want to get the parameters for contract call, you can do as follows:
=== */

const paramsForContract = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'extractParams' }
);

console.log(paramsForContract);

/* ===
The return type will be a tuple, which is the list of parameters to be passed to
the corresponding contract if you are using Ethers.js. Note that the `overrides`
field is also returned. In this case, the function calls the [RouterContract]
method [pendle-contract-addLiquiditySingleToken]. 
=== */

/* ===
### The `meta-method` method

This is the powerful method of Pendle SDK.
=== */

const metaMethod = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage,
    { method: 'meta-method' }
);


/* ===
The result of the function with `meta-method` method will be [ContractMetaMethod][api-ContractMetaMethod].
This object hold the intermediate calculation result, as well as do many other things.
=== */

/* ===
The intermediate calculation result can obtained via `.data` property.
=== */

const { netLpOut, priceImpact } = metaMethod.data;
console.log({ netLpOut, priceImpact });

/* ===
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
=== */

/* ===
`metaMethod` also _packed_ with all of the above methods. That is, `metaMethod` can be used
to send transaction, estimate gas, extract parameters, ... **WITHOUT** any recalculation.
=== */

{
    const callStaticResult = await metaMethod.callStatic();
    const gasEstimation = await metaMethod.estimateGas();
    const extractedParams = await metaMethod.extractParams();
    console.log({ callStaticResult, gasEstimation, extractedParams });

    const tx = await metaMethod.send();
    await tx.wait();
}

/* ===
[api-MetaMethodType]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/types/MetaMethodType.html
[api-Router]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/classes/Router.html
[api-Router-addLiquiditySingleToken]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/classes/Router.html#addLiquiditySingleToken
[api-ContractMetaMethod]: https://pendle-finance.github.io/pendle-sdk-core-v2-public/classes/ContractMetaMethod.html
[RouterContract]: https://etherscan.io/address/0x0000000001e4ef00d069e71d6ba041b0a16f7ea0#code
[pendle-contract-addLiquiditySingleToken]: https://github.com/pendle-finance/pendle-core-v2-public/blob/310bcc9e419b2122eaf65fd283f809023ceddae6/contracts/router/ActionAddRemoveLiq.sol#L209
[ethers-TransactionResponse]: https://docs.ethers.org/v5/api/providers/types/#providers-TransactionResponse
[ethers-UnsignedTransaction]: https://docs.ethers.org/v5/api/utils/transactions/#UnsignedTransaction
=== */

