/* ===
# Add liquidity to and remove liquidity from Pendle Pool with arbitrary token
---
=== */

/* ===
## Preparation
=== */

//// { "include": "../common/prepare-provider-and-signer.mts" }
/// <reference path="../common/prepare-provider-and-signer.d.ts" />

/* ===
## Create Pendle SDK Router
=== */
//// { "include": "../common/create-router.mts" }
/// <reference path="../common/create-router.d.ts" />

/* ===
## Add liquidity
Suppose that we want to add liquidity to the [PT stETH
Pool](https://app.pendle.finance/pro/pools/0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2/zap/in?chain=ethereum)
with 10 ETH.
=== */

import { toAddress, BN } from '@pendle/sdk-v2';
const poolAddress = toAddress('0xc374f7ec85f8c7de3207a10bb1978ba104bda3b2');
const ETH_DECIMALS = BN.from(10).pow(18);
const amountETHToZapIn = ETH_DECIMALS.mul(10);

/* ===
Here is how we can do it.
=== */

/* ===
### Step 1. Verify our balances before zap

=== */

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

/* ===
### Step 2. Approve our router
Since we are using ETH, we do not need to approve.

For the other ERC20 tokens, please approve our router as follows:

```ts
const amountToApprove = 0;  // your amount here
const approvalTx = await erc20Contract.approve(router.address, amountToApprove);
await approvalTx.wait();
```
=== */

/* ===
### Step 3. Make a transaction
=== */

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

/* ===
### Step 4. Verify our balances after zap
=== */

{
    const lpBalance = await poolContract.balanceOf(testAccounts[0].address);
    const ethBalance = await testAccounts[0].wallet.getBalance();
    console.log('Balances after zap', { lpBalance, ethBalance });
}

/* ===
## Remove liquidity

Now suppose we want to remove the liquidity but exit to
[stETH](https://etherscan.io/address/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84).

Here is how we can do it.
=== */

/* ===
### Step 1. Verify our balances before exit
=== */

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

/* ===
### Step 2. Approve our router.
=== */
const zapOutApproval = await poolContract.approve(router.address, lpToRemove);
await zapOutApproval.wait();

/* ===
### Step 3. Make transaction
=== */

const tokenOutAddress = stEthContract.address;
const zapOutTx = await router.removeLiquiditySingleToken(
    poolAddress,
    lpToRemove,
    tokenOutAddress,
    slippage
);

await zapOutTx.wait();

/* ===
### Step 4. Verify our balances after exit
=== */
{
    const lpBalance = await poolContract.balanceOf(testAccounts[0].address);
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances after exit', { lpBalance, stEthBalance });
}
