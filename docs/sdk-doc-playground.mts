/* ===
# Playground for Pendle SDK docs
=== */

const chainId = 1;

/* ===
The Pendle SDK documentation is interactive, including this page. It is written
in TypeScript and can be execute to get the output! But running in the real
network is not cheap. To generate the outputs, we run the documentation in a
local fork.

This module provides the environment for the other documentation, including the
network provider of the local fork, the test accounts with prefilled
balance of some tokens, and some other functionalities.
=== */

/* ===
## Readable `BigNumber` value when printing
Pendle SDK is built on top of `ethers` v5 library, and `ethers` uses `BigNumber`
to do calculation with high precision integers. But its output is not readable for
us.
=== */
import { BN } from '@pendle/sdk-v2';
console.log(BN.from(123));

/* ===
With the following fix from [hardhat-ethers](https://github.com/NomicFoundation/hardhat/blob/main/packages/hardhat-ethers/src/internal/index.ts#L19-L25),
we can have a nice presentation of `BigNumber` logging into the console.
=== */

const registerCustomInspection = (BigNumber: any) => {
    const inspectCustomSymbol = Symbol.for('nodejs.util.inspect.custom');
    BigNumber.prototype[inspectCustomSymbol] = function () {
        return `BigNumber { value: "${this.toString()}" }`;
    };
};
registerCustomInspection(BN);

console.log(BN.from(123));

/* ===
## Network provider

We use `hardhat` to run a local fork. This can be done with the following
command from the root directory of [Pendle SDK docs](https://github.com/pendle-finance/pendle-sdk-core-v2-docs).

```sh
yarn local-fork
```

The JSON-RPC url will be `http://localhost:8545`, which is also the default URL of
[StaticJsonRpcProvider](https://docs.ethers.org/v5/api/providers/jsonrpc-provider/#StaticJsonRpcProvider).

See [hardhat documentatoin on forking networks](https://hardhat.org/hardhat-network/docs/guides/forking-other-networks)
=== */

import { providers } from 'ethers';
export const provider = new providers.StaticJsonRpcProvider();

/* ===
## Test accounts
Mnemonic defaultly used by hardhat to generate accounts with 1000ETH.

See [hardhat reference](https://hardhat.org/hardhat-network/docs/reference).
=== */

import { utils, Wallet } from 'ethers';
import { Address, toAddress } from '@pendle/sdk-v2';

const testMnemonic = 'test test test test test test test test test test test junk';
export const masterHDNode = utils.HDNode.fromMnemonic(testMnemonic);

function createTestAccount(id: number) {
    const path = `m/44'/60'/0'/0/${id}`;
    const derrivedNode = masterHDNode.derivePath(path);
    const address = toAddress(derrivedNode.address);
    const wallet = new Wallet(derrivedNode.privateKey, provider);
    return {
        address,
        wallet,
    };
}

export const testAccounts = Array.from({ length: 10 }, (_, id) => createTestAccount(id));
console.log(testAccounts.map(({ address }) => address));

/* ===
We can test their balance as follows:
=== */
import { createERC20, NATIVE_ADDRESS_0xEE } from '@pendle/sdk-v2';
const nativeTokenERC20 = createERC20(NATIVE_ADDRESS_0xEE, { provider, chainId });
console.log(await nativeTokenERC20.balanceOf(testAccounts[0].address));

/* ===
### Setting accounts balance for some tokens
To do this, we need to do some _hacking_. As we are using a local fork, we can
directly set the user balance in the contract's memory by setting the storage value
with the following function.
=== */

import { ethers } from 'ethers';

async function setRawERC20Balance(address: Address, user: Address, rawAmount: BN, slot: number, reverse = false) {
    const order = reverse ? [slot, user] : [user, slot];
    const index = ethers.utils.solidityKeccak256(['uint256', 'uint256'], order);
    await provider.send('hardhat_setStorageAt', [address, index, ethers.utils.hexZeroPad(rawAmount.toHexString(), 32)]);
}

async function setERC20BalanceForAllAccounts(tokenAddress: Address, amount: BN, slot: number, reverse = false) {
    const tokenDecimals = await createERC20(tokenAddress, { provider, chainId }).decimals();
    const rawAmount = BN.from(10).pow(tokenDecimals).mul(amount);
    await Promise.all(
        testAccounts.map(({ address: userAddress }) =>
            setRawERC20Balance(tokenAddress, userAddress, rawAmount, slot, reverse)
        )
    );
}

/* ===
Here is how we set the balance for USDC.
=== */

const USDCAddress = toAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const USDCSlot = 9;
const usdcERC20 = createERC20(USDCAddress, { provider, chainId });
console.log('Balance before: ', await usdcERC20.balanceOf(testAccounts[0].address));
await setERC20BalanceForAllAccounts(USDCAddress, BN.from(1000), USDCSlot, false);
console.log('Balance after:', await usdcERC20.balanceOf(testAccounts[0].address));

/* ===
Here the slot number is found beforehand, we just hardcoded it. We can also set the balance
for some other interesting tokens.
=== */

const slotData: Record<string, [tokenAddress: Address, slot: number, reverse: boolean]> = {
    USDT: [toAddress('0xdac17f958d2ee523a2206206994597c13d831ec7'), 2, false],
    DAI: [toAddress('0x6b175474e89094c44da98b954eedeac495271d0f'), 2, false],
    // WETH: [toAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'), 3, false],
    FRAX: [toAddress('0x853d955acef822db058eb8505911ed77f175b99e'), 0, false],
    USDC: [toAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'), 9, false],
};

for (const [tokenAddress, slot, reverse] of Object.values(slotData)) {
    setERC20BalanceForAllAccounts(tokenAddress, BN.from(1000), slot, reverse);
}
