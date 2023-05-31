
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
import { provider, testAccounts } from '../playground.mjs';

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
  ethBalance: '10000.0'
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
import { toAddress, BN } from '@pendle/sdk-v2';
const poolAddress = toAddress('0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2');
const ETH_DECIMALS = BN.from(10).pow(18);
const amountETHToZapIn = ETH_DECIMALS.mul(10);
```

Here is how we can do it.

### Step 1. Verify our balances before zap

```ts
import { createERC20, MarketEntity } from '@pendle/sdk-v2';
const poolContract = new MarketEntity(poolAddress, {
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});
{
    const lpBalance = await poolContract.balanceOf(testAccounts[0].address);
    const ethBalance = await testAccounts[0].wallet.getBalance();
    console.log('Balances before zap', { lpBalance, ethBalance });
}
```

Output:

```
Balances before zap {
  lpBalance: BigNumber { value: "0" },
  ethBalance: BigNumber { value: "10000000000000000000000" }
}
```

### Step 2. Approve our router
Since we are using ETH, we do not need to approve.

For the other ERC20 tokens, please approve our router as follows:

```ts
const amountToApprove = 0;  // your amount here
const approvalTx = await erc20Contract.approve(router.address, amountToApprove);
await approvalTx.wait();
```

### Step 3. Make a transaction

```ts
import { NATIVE_ADDRESS_0x00 } from '@pendle/sdk-v2';

const slippage = 0.2 / 100;
const tokenInAddress = NATIVE_ADDRESS_0x00;
const zapInTx = await router.addLiquiditySingleToken(
    poolAddress,
    tokenInAddress,
    amountETHToZapIn,
    slippage
);

await zapInTx.wait();
```

### Step 4. Verify our balances after zap

```ts
{
    const lpBalance = await poolContract.balanceOf(testAccounts[0].address);
    const ethBalance = await testAccounts[0].wallet.getBalance();
    console.log('Balances after zap', { lpBalance, ethBalance });
}
```

Output:

```
Balances after zap {
  lpBalance: BigNumber { value: "4957320026138737000" },
  ethBalance: BigNumber { value: "9989985641478507745516" }
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
let lpToRemove: BN;
{
    const lpBalance = await poolContract.balanceOf(testAccounts[0].address);
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances before exit', { lpBalance, stEthBalance });

    lpToRemove = lpBalance; // Remove all liquidity
}
```

Output:

```
Balances before exit {
  lpBalance: BigNumber { value: "4957320026138737000" },
  stEthBalance: BigNumber { value: "0" }
}
```

### Step 2. Approve our router.

```ts
const zapOutApproval = await poolContract.approve(router.address, lpToRemove);
await zapOutApproval.wait();
```

### Step 3. Make transaction

```ts
const tokenOutAddress = stEthContract.address;
const zapOutTx = await router.removeLiquiditySingleToken(
    poolAddress,
    lpToRemove,
    tokenOutAddress,
    slippage
);

await zapOutTx.wait();
```

### Step 4. Verify our balances after exit

```ts
{
    const lpBalance = await poolContract.balanceOf(testAccounts[0].address);
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances after exit', { lpBalance, stEthBalance });
}
```

Output:

```
Balances after exit {
  lpBalance: BigNumber { value: "0" },
  stEthBalance: BigNumber { value: "9989423389432487905" }
}
```
