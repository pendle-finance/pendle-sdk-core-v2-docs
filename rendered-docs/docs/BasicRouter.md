# Pendle SDK `BasicRouter`

---

`Router` is the main feature of Pendle SDK. It handles all the trading logic while ensuring the user will receive the optimal amount after trades. It also returns the intermediate results, allowing us to do further calculations.

`BasicRouter` is a simple implementation of `Router` that doesn't support the use of aggregator (e.g KyberSwap), and doesn't support bulkSeller.

## Getting started

### Create a Basic Router instance

Suppose that we want to create a router on Mainnet(with chain id of `1`). 

```typescript
const chainId = 1;
```

First, we need to have a `Signer` and/or a `Provider`. Most of the time, `Signer` can be used. But when sending transaction is not required, `Provider` is enough. 

```javascript


import { providers } from 'ethers';
import { BasicRouter } from '@pendle/sdk-v2';

const providerUrl = 'https://rpc.ankr.com/eth'
const provider = new providers.StaticJsonRpcProvider(providerUrl);

const basicRouter = BasicRouter.getBasicRouter({ chainId, provider });
```

## Example: swap from known amount of token to PT

Before doing any action, we should first have an address of a Pendle Market to interact with. [Pendle Backend][Pendle-Backend] can be used to obtain the whitelisted markets. For demonstration, we are going to use the FRAX USDC market, with the token in is USDC:

<!-- TODO update docs link -->
[Pendle-Backend]: https://api-v2.pendle.finance/core/graphql

```typescript
import { toAddress } from '@pendle/sdk-v2';
// FRAX USDC market address
const marketAddress = toAddress('0x7b246b8dbc2a640bf2d8221890cee8327fc23917');
// USDC token address
const tokenAddress = toAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
```

Now suppose we want to simulate trade some USDC to the market's PT token. We can use `BasicRouter`'s `swapExactTokenForPt` method as follows:

```typescript
import { BN } from '@pendle/sdk-v2';
// BN is the alias of ethers.BigNumber
const slippage = 1 / 100; // 1% slippage
const amount = BN.from(100000000); // 100 USDC
const metaMethod = await basicRouter.swapExactTokenForPt(
    marketAddress,
    tokenAddress,    // token address
    amount,          // token amount
    slippage,
    {
        method: 'meta-method'
    }
);
```

```typescript
import { calcSlippedDownAmount } from '@pendle/sdk-v2';
const simulateData = metaMethod.data;
const netPtOut = simulateData.netPtOut;
const minPtOut = calcSlippedDownAmount(netPtOut, slippage);
const guessParams = simulateData.route.context.guessOutApproxParams(netPtOut, slippage);
const tokenInputData = simulateData.input;
console.log({
    'netPtOut': netPtOut.toString(),
    'minPtOut': minPtOut.toString(),
    'tokenInputData': tokenInputData, // this is the input data to pass in the router contract
    'guessParams': guessParams
});
```

Outputs:

<pre><code>{
  netPtOut: '100266946016548822645',
  minPtOut: '99264276556383334418',
  tokenInputData: {
    tokenIn: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    netTokenIn: BigNumber { _hex: '0x05f5e100', _isBigNumber: true },
    tokenMintSy: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    kybercall: [],
    bulk: '0x0000000000000000000000000000000000000000',
    kyberRouter: '0x0000000000000000000000000000000000000000'
  },
  guessParams: {
    guessMin: BigNumber { _hex: '0x0561918d9a755d3012', _isBigNumber: true },
    guessMax: BigNumber { _hex: '0x05b50ebcf92724c661', _isBigNumber: true },
    guessOffchain: BigNumber { _hex: '0x056f7bc02a3da91e75', _isBigNumber: true },
    maxIteration: 9,
    eps: '1000000000000000'
  }
}

</code></pre><br>

Now we can use those calculated values to call the router contract's `swapExactTokenForPt` method:
```ts
const routerContract = /* get the router contract */
routerContract.connect(/* signer */).swapExactTokenForPt(
    receiver,
    marketAddress,
    minPtOut,
    guessParams,
    input
);
```

## Example: swap from known amount of PT to Token

```typescript
const exactPtIn = BN.from(10).pow(18).mul(100); // 100 PT
const metaMethod = await basicRouter.swapExactPtForToken(
    marketAddress,
    exactPtIn,     // amount of pt in
    tokenAddress,  // token address
    slippage,
    {
        method: 'meta-method'
    }
);
```

```typescript
import { calcSlippedDownAmount } from '@pendle/sdk-v2';
const simulateData = metaMethod.data;
const netTokenOut = simulateData.netTokenOut;
const minTokenOut = calcSlippedDownAmount(netTokenOut, slippage);
const tokenOutputData = simulateData.output;
console.log({
    'netTokenOut': netTokenOut.toString(),
    'minTokenOut': minTokenOut.toString(),
    'tokenOutputData': tokenOutputData,
});
```

Outputs:

<pre><code>{
  netTokenOut: '99695192',
  minTokenOut: '98698240',
  tokenOutputData: {
    tokenOut: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    minTokenOut: BigNumber { _hex: '0x05e20400', _isBigNumber: true },
    tokenRedeemSy: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    kybercall: [],
    bulk: '0x0000000000000000000000000000000000000000',
    kyberRouter: '0x0000000000000000000000000000000000000000'
  }
}

</code></pre><br>

Now we can use those calculated values to call the router contract's `swapExactPtForToken` method:
```ts
const routerContract = /* get the router contract */
routerContract.connect(/* signer */).swapExactPtForToken(
    receiver,
    marketAddress,
    exactPtIn,
    output
);
```

## Handling error

Pendle SDK is based on Ethersjs, which is a very versatile library. But while handling all the interactions with the contract, Ethersjs’ error handling process is very cryptic. Ethersjs Error does not support typing, as well as the actual error is often nested very deeply. Pendle SDK includes some utilities that helps aid the error handling process while interacting with the contracts.


When error, Pendle contracts will thrown an Error message defined in [this contract](https://github.com/pendle-finance/pendle-core-v2/blob/main/contracts/core/libraries/Errors.sol). Those error will be wrapped into the `PendleContractError`. The instance of this class has two main properties:
- `errorName` - the name of the error.
- `args` - the arguments that passed to the error on the contract side. 

```typescript
import { PendleContractError, BN } from '@pendle/sdk-v2';
try {
    const veryLargeAmount = BN.from(10).pow(18); // 1e12 USDC
    const metaMethod = await basicRouter.swapExactTokenForPt(
        marketAddress,
        tokenAddress,    // token address
        veryLargeAmount, // token amount
        slippage,
        {
            method: 'meta-method'
        }
    );
} catch (e) {
    if (e instanceof PendleContractError) {
        console.log("ErrorName: ", e.errorName);
        if (e.isType('ApproxFail')) {
            console.log('ApproxFail', e.args);
            // do something
        } else if (e.isType('MarketExpired')) {
            // do something
        } else {
            // ...
        }
    }
}
```

Outputs:

<pre><code>ErrorName:  ApproxFail
ApproxFail []

</code></pre><br>