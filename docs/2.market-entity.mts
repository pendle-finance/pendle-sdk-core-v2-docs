/* ===
# Pendle SDK `MarketEntity`.

Pendle SDk `MarketEntity` is a simple entity that wrap around
[PendleMarket contract](https://github.com/pendle-finance/pendle-core-v2-public/blob/main/contracts/core/Market/PendleMarket.sol).
This entity allows the user to get the basic information about a
`PendleMarket`.

`MarketEntity` is also a Pendle SDK `ERC20Entity`, because in reality, the
`PendleMarket` contract is technically also an `ERC20` contract. Please
checkout [Pendle SDK ERC2 tutorial](./1.erc20-tutorial.mts) for fully-explained
functionalities of `ERC20Entity` in particular, and of `PendleEntity` in
general.
=== */

/* ===
## `MarketEntity` object creation.

Similar to `ERC20Entity`, `MarketEntity` requires:
- The contract address.
- Network Provider and/or a Signer

Additionally, `MarketEntity` requires the `chainId` to get the off-chain helper
for the corresponding chain.

Let's take a look at the [FRAX-USDC market](https://app.pendle.finance/pro/markets/0x7b246b8dbc2a640bf2d8221890cee8327fc23917/swap?view=yt)
=== */

import {
    toAddress,
    MarketEntity,
    ERC20Entity,
    Multicall,
} from '@pendle/sdk-v2';
import { provider } from './playground.mjs';
const FRAX_USDCContractAddress = toAddress(
    '0x7b246b8dbc2a640bf2d8221890cee8327fc23917'
);

const FRAX_USDCMarket = new MarketEntity(FRAX_USDCContractAddress, {
    chainId: 1,
    provider,

    // This is optional. Including `Multicall` here will enable multicall for
    // subsequenct read-only calls.
    multicall: new Multicall({ chainId: 1, provider }),
});

async function getERC20MetaData(erc20: ERC20Entity) {
    const [name, symbol, totalSupply, decimals] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        erc20.totalSupply(),
        erc20.decimals(),
    ]);
    return { name, symbol, totalSupply, decimals };
}

console.log(await getERC20MetaData(FRAX_USDCMarket));

/* ===
## Getting corresponding tokens of a `MarketEntity`.
We can get the Market's `PT`, `YT` and `Sy` tokens' addresses using the the
method with the same name.
=== */

{
    const [ptAddress, ytAddress, syAddress] = await Promise.all([
        FRAX_USDCMarket.PT(),
        FRAX_USDCMarket.YT(),
        FRAX_USDCMarket.SY(),
    ]);
    console.log({ ptAddress, ytAddress, syAddress });
}

/* ===
The function name are all CAP to reflect the same functions of the contract.
`MarketEntity` also includes the lowercase function as alias.
=== */

{
    const [ptAddress, ytAddress, syAddress] = await Promise.all([
        FRAX_USDCMarket.pt(),
        FRAX_USDCMarket.yt(),
        FRAX_USDCMarket.sy(),
    ]);
    console.log({ ptAddress, ytAddress, syAddress });
}

/* ===
### Getting the tokens as `PendleEntity`
Use `ptEntity`, `ytEntity` and `syEntity` to get the coressponding
`PendleEntity` of `PT`, `YT` and `SY` with the same configuration as
the `MarketEntity.
=== */

{
    const [ptEntity, ytEntity, syEntity] = await Promise.all([
        FRAX_USDCMarket.ptEntity(),
        FRAX_USDCMarket.ytEntity(),
        FRAX_USDCMarket.syEntity(),
    ]);

    console.log({
        ptInfo: await getERC20MetaData(ptEntity),
        ytInfo: await getERC20MetaData(ytEntity),
        syInfo: await getERC20MetaData(syEntity),
    });
}

/* ===
### Getting the reward tokens
=== */
console.log(await FRAX_USDCMarket.getRewardTokens());

/* ===
## Getting market information
To get the [PendleMarket contract state](https://github.com/pendle-finance/pendle-core-v2-public/blob/38347af3b08ffc6cbf6ab5c70f4aee0b29ef4be6/contracts/core/Market/MarketMathCore.sol#L11),
we can use `MarketEntity#readState` function.
=== */

console.log(await FRAX_USDCMarket.readState());

/* ===
We also provides a higher-level function called `MarketEntity#getMarketInfo`. This functions also
returns the market state, as well as two other fields: `marketExchangeRateExcludeFee` and `impliedYield`.
=== */

console.log(await FRAX_USDCMarket.getMarketInfo());

/* ===
## Getting user information
To demonstrate the usage of the functions, we should have an user
address that already had balance in this market. Let's consider
the user `0xbD525dfF925DF9c063C77B29d5Eec8f977B79476`.
=== */

const userAddress = toAddress('0xbD525dfF925DF9c063C77B29d5Eec8f977B79476');

/* ===
### Getting user's balance and user's active balance.
=== */

console.log({
    userBalance: await FRAX_USDCMarket.balanceOf(userAddress),
    userActiveBalance: await FRAX_USDCMarket.activeBalance(userAddress),
});

/* ===
### Getting user's balances and unclaim rewards
=== */
console.log(await FRAX_USDCMarket.getUserMarketInfo(userAddress));

/* ===
## Redeem rewards
### Simulation
To simulate the rewards redeeming process, use `MarketEntity#simulateRewards` function.
=== */

console.log(await FRAX_USDCMarket.getRewardTokens());
console.log(await FRAX_USDCMarket.simulateRedeemRewards(userAddress));

/* ===
To pair the rewards with the coressponding tokens, use
`MarketEntity#simulateRedeemRewardsWithTokens` function.
=== */

console.log(await FRAX_USDCMarket.simulateRedeemRewardsWithTokens(userAddress));

/* ===
### Redeem rewards for user
Use `MarketEntity#redeemRewards` to perform the reward redeeming transaction
for a given user. As this is a write contract, a signer is require.
=== */

import { testAccounts } from './playground.mjs';

{
    const writeContract = new MarketEntity(FRAX_USDCContractAddress, {
        chainId: 1,
        signer: testAccounts[0].wallet,
    });

    console.log('Before:');
    console.log(await writeContract.getUserMarketInfo(userAddress));

    const transaction = await writeContract.redeemRewards(userAddress);
    await transaction.wait(/* confirmation= */ 1);

    console.log('After:');
    console.log(await writeContract.getUserMarketInfo(userAddress));
}
