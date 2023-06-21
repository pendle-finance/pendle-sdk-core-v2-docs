---
hide_table_of_contents: true
---


# Add liquidity to and remove liquidity from Pendle Pool with arbitrary token
---

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
import { provider, testAccounts } from './sdk-doc-playground.mjs';

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
  ethBalance: '9984.962431474063914962'
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

## Add liquidity
Suppose that we want to add liquidity to the [PT stETH
Pool](https://app.pendle.finance/pro/pools/0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2/zap/in?chain=ethereum)
with 10 ETH.

```ts
import { toAddress, BN, createERC20, NATIVE_ADDRESS_0x00 } from '@pendle/sdk-v2';
const marketAddress = toAddress('0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2');

// Pendle SDK `createERC20` can provide the same functionality of an ERC20
// to native token (ETH).
const ethWrappedERC20 = createERC20(NATIVE_ADDRESS_0x00, {
    chainId: 1, // ethereum chain
    provider,
    signer: testAccounts[0].wallet,
});
const ETH_DECIMALS = BN.from(10).pow(await ethWrappedERC20.decimals());
const amountETHToZapIn = ETH_DECIMALS.mul(10);
```

Here is how we can do it.

### Step 1. Verify our balances before zap

```ts
import { MarketEntity } from '@pendle/sdk-v2';
const marketContract = new MarketEntity(marketAddress, {
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});
```



```ts
{
    const lpBalance = await marketContract.balanceOf(testAccounts[0].address);
    const ethBalance = await ethWrappedERC20.balanceOf(testAccounts[0].address);
    console.log('Balances before zap', { lpBalance, ethBalance });
}
```

Output:

```
Balances before zap {
  lpBalance: BigNumber { value: "7415060155749829537" },
  ethBalance: BigNumber { value: "9984962431474063914962" }
}
```

### Step 2. Approve our router
Since we are using ETH, we **do not** actually need to approve.

However, since `createERC20` wrap native token the same way as a normal ERC20,
we can still do as follows:

```ts
await ethWrappedERC20.approve(router.address, amountETHToZapIn).then((tx) => tx?.wait());
console.log(
    'Approved amount:',
    await ethWrappedERC20.allowance(testAccounts[0].address, router.address)
);
```

Output:

```
Approved amount: BigNumber { value: "115792089237316195423570985008687907853269984665640564039457584007913129639935" }
```

The result is `2^256 - 1`. As stated above, this is a _wrapped_ process.

For the other ERC20 tokens, the process is similar.

### Step 3. Make a transaction

```ts
const slippage = 0.2 / 100;
const tokenInAddress = NATIVE_ADDRESS_0x00;
const amountTokenIn = amountETHToZapIn;
```



```ts
const zapInTx = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage
);

await zapInTx.wait();
```

### Step 4. Verify our balances after zap

```ts
{
    const lpBalance = await marketContract.balanceOf(testAccounts[0].address);
    const ethBalance = await testAccounts[0].wallet.getBalance();
    console.log('Balances after zap', { lpBalance, ethBalance });
}
```

Output:

```
Balances after zap {
  lpBalance: BigNumber { value: "12358483288388593847" },
  ethBalance: BigNumber { value: "9974960366344521708826" }
}
```

## Remove liquidity

Now suppose we want to remove the liquidity but exit to
[stETH](https://etherscan.io/address/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84).

Here is how we can do it.

### Step 1. Verify our balances before exit

```ts
const stEthContract = createERC20(toAddress('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'), {
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});

// we remove all LP to stEth.
const lpToRemove = await marketContract.balanceOf(testAccounts[0].address);
```



```ts
{
    const lpBalance = lpToRemove;
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances before exit', { lpBalance, stEthBalance });
}
```

Output:

```
Balances before exit {
  lpBalance: BigNumber { value: "12358483288388593847" },
  stEthBalance: BigNumber { value: "0" }
}
```

### Step 2. Approve our router.
Note that we need to approve with the market contract, not the stEth contract.

```ts
const zapOutApproval = await marketContract.approve(router.address, lpToRemove);
await zapOutApproval.wait();
console.log('Approved amount:', marketContract.allowance(testAccounts[0].address, router.address));
```

Output:

```
Approved amount: Promise { <pending> }
```

### Step 3. Make transaction

```ts
const tokenOutAddress = stEthContract.address;
const zapOutTx = await router.removeLiquiditySingleToken(
    marketAddress,
    lpToRemove,
    tokenOutAddress,
    slippage
);

await zapOutTx.wait();
```

### Step 4. Verify our balances after exit

```ts
{
    const lpBalance = await marketContract.balanceOf(testAccounts[0].address);
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances after exit', { lpBalance, stEthBalance });
}
```

Output:

```
Balances after exit {
  lpBalance: BigNumber { value: "0" },
  stEthBalance: BigNumber { value: "24974694703001963936" }
}
```
