/* ===
# Buy PT and YT token with Pendle SDK.
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
## By PT
Suppose that we want to buy PT in
[USDT](https://app.pendle.finance/pro/markets/0x30e0dc9a1d33eac83211a1113de238b3ce826950/swap?view=pt&chain=ethereum)
with 10 USDT.
=== */

import { toAddress, BN, ERC20Entity } from '@pendle/sdk-v2';
const marketAddress = toAddress('0x30e0dc9a1d33eac83211a1113de238b3ce826950');

const usdtContract = new ERC20Entity(toAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'), {
    provider,
    signer: testAccounts[0].wallet,
});
const USDT_DECIMALS = BN.from(10).pow(await usdtContract.decimals());
const amountUSDT = USDT_DECIMALS.mul(10);

/* ===
Here is how we can do it.
=== */

/* ===
### Step 1. Verify our balances before zap

=== */

import { MarketEntity } from '@pendle/sdk-v2';
const marketContact = new MarketEntity(marketAddress, {
    chainId: 1,
    provider,
    signer: testAccounts[0].wallet,
});
const ptContract = await marketContact.ptEntity();

/* ===
=== */

{
    const ptBalance = await ptContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances before buying PT', { ptBalance, usdtBalance });
}

/* ===
### Step 2. Approve our router
=== */

await usdtContract.approve(router.address, amountUSDT).then((tx) => tx.wait());
console.log(
    'Approval amount:',
    await usdtContract.allowance(testAccounts[0].address, router.address)
);

/* ===
### Step 3. Make a transaction
=== */

const slippage = 0.2 / 100;
const tokenInAddress = usdtContract.address;
const amountTokenInToSwap = amountUSDT;

/* ===
=== */

const buyPtTx = await router.swapExactTokenForPt(
    marketAddress,
    tokenInAddress,
    amountTokenInToSwap,
    slippage
);

await buyPtTx.wait();

/* ===
### Step 4. Verify our balances after buying PT
=== */

{
    const ptBalance = await ptContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances after buying PT', { ptBalance, usdtBalance });
}

/* ===
## By YT
Suppose that we want to buy YT in
[USDT](https://app.pendle.finance/pro/markets/0x30e0dc9a1d33eac83211a1113de238b3ce826950/swap?view=pt&chain=ethereum)
with 10 USDT. That is, in the same market, with the same parameters.
=== */

/* ===
Here is how we can do it.
=== */

/* ===
### Step 1. Verify our balances before zap

=== */

const ytContract = await marketContact.ytEntity();

/* ===
=== */

{
    const ytBalance = await ytContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances before buying YT', { ytBalance, usdtBalance });
}

/* ===
### Step 2. Approve our router
=== */

await usdtContract.approve(router.address, amountUSDT).then((tx) => tx.wait());
console.log(
    'Approval amount:',
    await usdtContract.allowance(testAccounts[0].address, router.address)
);

/* ===
### Step 3. Make a transaction
=== */

const buyYtTx = await router.swapExactTokenForYt(
    marketAddress,
    tokenInAddress,
    amountTokenInToSwap,
    slippage
);

await buyYtTx.wait();

/* ===
### Step 4. Verify our balances after buying PT
=== */

{
    const ytBalance = await ytContract.balanceOf(testAccounts[0].address);
    const usdtBalance = await usdtContract.balanceOf(testAccounts[0].address);
    console.log('Balances after buying YT', { ytBalance, usdtBalance });
}
