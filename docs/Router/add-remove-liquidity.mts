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

/* ===
Here is how we can do it.
=== */

/* ===
### Step 1. Verify our balances before zap

=== */

import { MarketEntity } from '@pendle/sdk-v2';
const marketContract = new MarketEntity(marketAddress, {
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});

/* ===
=== */

{
    const lpBalance = await marketContract.balanceOf(testAccounts[0].address);
    const ethBalance = await ethWrappedERC20.balanceOf(testAccounts[0].address);
    console.log('Balances before zap', { lpBalance, ethBalance });
}

/* ===
### Step 2. Approve our router
Since we are using ETH, we **do not** actually need to approve.

However, since `createERC20` wrap native token the same way as a normal ERC20,
we can still do as follows:
=== */

await ethWrappedERC20.approve(router.address, amountETHToZapIn).then((tx) => tx?.wait());
console.log(
    'Approved amount:',
    await ethWrappedERC20.allowance(testAccounts[0].address, router.address)
);

/* ===
The result is `2^256 - 1`. As stated above, this is a _wrapped_ process.
=== */

/* ===
### Step 3. Make a transaction
=== */

const slippage = 0.2 / 100;
const tokenInAddress = NATIVE_ADDRESS_0x00;
const amountTokenIn = amountETHToZapIn;

/* ===
=== */

const zapInTx = await router.addLiquiditySingleToken(
    marketAddress,
    tokenInAddress,
    amountTokenIn,
    slippage
);

await zapInTx.wait();

/* ===
### Step 4. Verify our balances after zap
=== */

{
    const lpBalance = await marketContract.balanceOf(testAccounts[0].address);
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

// we remove all LP to stEth.
const lpToRemove = await marketContract.balanceOf(testAccounts[0].address);

/* ===
=== */

{
    const lpBalance = lpToRemove;
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances before exit', { lpBalance, stEthBalance });
}

/* ===
### Step 2. Approve our router.
Note that we need to approve with the market contract, not the stEth contract.
=== */

const zapOutApproval = await marketContract.approve(router.address, lpToRemove);
await zapOutApproval.wait();
console.log('Approved amount:', marketContract.allowance(testAccounts[0].address, router.address));

/* ===
### Step 3. Make transaction
=== */

const tokenOutAddress = stEthContract.address;
const zapOutTx = await router.removeLiquiditySingleToken(
    marketAddress,
    lpToRemove,
    tokenOutAddress,
    slippage
);

await zapOutTx.wait();

/* ===
### Step 4. Verify our balances after exit
=== */
{
    const lpBalance = await marketContract.balanceOf(testAccounts[0].address);
    const stEthBalance = await stEthContract.balanceOf(testAccounts[0].address);
    console.log('Balances after exit', { lpBalance, stEthBalance });
}
