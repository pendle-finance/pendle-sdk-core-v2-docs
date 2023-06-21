---
hide_table_of_contents: true
---


# Buy PT and YT token with Pendle SDK.

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
  ethBalance: '9984.974489829368581193'
}
```

## Create Pendle SDK Router

Pendle SDK Router is an object that interacts with [Pendle Router
contract](https://etherscan.io/address/0x0000000001e4ef00d069e71d6ba041b0a16f7ea0).
It can be created as follows:

```ts
import { Router } from '@pendle/sdk-v2';

const router = Router.getRouter({
    chainId: 1, // ethereum chain id
    provider,
    signer: testAccounts[0].wallet,
});

console.log('Router address:', router.address);
```

Output:

```
Router address: 0x0000000001e4ef00d069e71d6ba041b0a16f7ea0
```

## By PT
Suppose that we want to buy PT in
[USDT](https://app.pendle.finance/pro/markets/0x30e0dc9a1d33eac83211a1113de238b3ce826950/swap?view=pt&chain=ethereum)
with 10 USDT.

```ts
import { toAddress, BN, ERC20Entity } from '@pendle/sdk-v2';
const marketAddress = toAddress('0x30e0dc9a1d33eac83211a1113de238b3ce826950');

const usdtContract = new ERC20Entity(toAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'), {
    provider,
    signer: testAccounts[0].wallet,
});
const USDT_DECIMALS = BN.from(10).pow(await usdtContract.decimals());
const amountUSDT = USDT_DECIMALS.mul(10);
```

Here is how we can do it.

### Step 1. Verify our balances before zap

```ts
import { MarketEntity } from '@pendle/sdk-v2';
const marketContact = new MarketEntity(marketAddress, {
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});
const ptContract = await marketContact.ptEntity();
```



```ts
{
    const ptBalance = await ptContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances before buying PT', { ptBalance, usdtBalance });
}
```

Output:

```
Balances before buying PT {
  ptBalance: BigNumber { value: "0" },
  usdtBalance: BigNumber { value: "1000000000" }
}
```

### Step 2. Approve our router

```ts
await usdtContract.approve(router.address, amountUSDT).then((tx) => tx.wait());
console.log(
    'Approved amount:',
    await usdtContract.allowance(testAccounts[0].address, router.address)
);
```

Output:

```
Approved amount: BigNumber { value: "10000000" }
```

### Step 3. Make a transaction

```ts
const slippage = 0.2 / 100;
const tokenInAddress = usdtContract.address;
const amountTokenInToSwap = amountUSDT;
```



```ts
const buyPtTx = await router.swapExactTokenForPt(
    marketAddress,
    tokenInAddress,
    amountTokenInToSwap,
    slippage
);

await buyPtTx.wait();
```

### Step 4. Verify our balances after buying PT

```ts
{
    const ptBalance = await ptContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances after buying PT', { ptBalance, usdtBalance });
}
```

Output:

```
Balances after buying PT {
  ptBalance: BigNumber { value: "10390800" },
  usdtBalance: BigNumber { value: "990000000" }
}
```

## By YT
Suppose that we want to buy YT in
[USDT](https://app.pendle.finance/pro/markets/0x30e0dc9a1d33eac83211a1113de238b3ce826950/swap?view=pt&chain=ethereum)
with 10 USDT. That is, in the same market, with the same parameters.

Here is how we can do it.

### Step 1. Verify our balances before zap

```ts
const ytContract = await marketContact.ytEntity();
```



```ts
{
    const ytBalance = await ytContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances before buying YT', { ytBalance, usdtBalance });
}
```

Output:

```
Balances before buying YT {
  ytBalance: BigNumber { value: "0" },
  usdtBalance: BigNumber { value: "990000000" }
}
```

### Step 2. Approve our router

```ts
await usdtContract.approve(router.address, amountUSDT).then((tx) => tx.wait());
console.log(
    'Approved amount:',
    await usdtContract.allowance(testAccounts[0].address, router.address)
);
```

Output:

```
Approved amount: BigNumber { value: "10000000" }
```

### Step 3. Make a transaction

```ts
const buyYtTx = await router.swapExactTokenForYt(
    marketAddress,
    tokenInAddress,
    amountTokenInToSwap,
    slippage
);

await buyYtTx.wait();
```

### Step 4. Verify our balances after buying PT

```ts
{
    const ytBalance = await ytContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances after buying YT', { ytBalance, usdtBalance });
}
```

Output:

```
Balances after buying YT {
  ytBalance: BigNumber { value: "252493988" },
  usdtBalance: BigNumber { value: "980000000" }
}
```
