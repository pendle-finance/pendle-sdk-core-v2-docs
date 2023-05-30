
# Multicall

---

Multicall is the preferred way to call contract methods and get hypothetical results. Pendle SDK has integrated https://github.com/makerdao/multicall by makerdao as a core component. Our multicall component is designed so that it is compatible with ethersjs’ Contract, as well as  [Pendle SDK’s WrappedContract](https://www.notion.so/Pendle-SDK-s-WrappedContract-18444f7d35d6411b87ce487812be4b58), can be used everywhere comfortably, but users also have the option to opt-out of using it if they don’t want to.

## Usage

### Multicall creation
```ts
import { Multicall, MulticallStatic } from '@pendle/sdk-v2';
import { provider } from './playground.mjs';

const chainId = 1;  // 1 for ethereum

const multicall = new Multicall({chainId, provider});
```
Multicall accepts 2 required parameters in its configuration, which are

- `chainId: ChainId` — the id of the chain to use multicall with. See `ChainId` type in  [Utilities types and functions](./utilities-types-and-functions.mts.md) - `provider: Provider` — the connection to the network.

Additionally, it accepts the following optional parameters:

- `callLimit: number = 64` — the maximum number of *calls* to be included in a *multicall*.

### Calling contract methods

To use multicall with ethresjs’ contract, first wrap it, then call it with `callStatic` (which is the only method).
```ts
import { PendleERC20, PendleERC20ABI, Address } from '@pendle/sdk-v2';
import { Contract } from 'ethers';

// an ERC20 contract object
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const contract = new Contract(USDCAddress, PendleERC20ABI, provider) as PendleERC20 & { [key in symbol]: MulticallStatic<PendleERC20> };

const contractWithMulticall = multicall.wrap(contract);

async function singleCall(userAddress: Address) {
	return await contractWithMulticall.callStatic.balanceOf(userAddress);
}
```
To test the `singleCall` function, we should pass in some addresses. Some interesting addresses can be taken from [etherscan.io's USDC holders page](https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48#balances).
```ts
import { toAddress } from '@pendle/sdk-v2';

const USDC_HOLDERS = {
    'Maker: PSM-USDC-A': toAddress('0x0a59649758aa4d66e25f08dd01271e891fe52199'),
    'Polygon (Matic): ERC20 Bridge': toAddress('0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf'),
    'Arbitrum One: L1 Arb - Custom Gateway': toAddress('0xcee284f754e854890e311e3280b767f80797180d'),
    'Binance 14': toAddress('0x28c6c06298d514db089934071355e5743bf21d60'),
} as const;
```
Now to test our function
```ts
console.log(String(await singleCall(USDC_HOLDERS['Maker: PSM-USDC-A'])))
```
Output:
```
2016607719400274

```
To have the *batching* effect, use it with `Promise.all`
```ts
async function multicallCall(userAddresses: Address[]) {
  return await Promise.all(userAddresses.map(
		userAddress => contractWithMulticall.callStatic.balanceOf(userAddress)
  ));
}
```

```ts
import { zip } from '@pendle/sdk-v2';

const balances = await multicallCall(Object.values(USDC_HOLDERS));
for (const [holder, balance] of zip(Object.keys(USDC_HOLDERS), balances)) {
    console.log(`${holder} is holding ${String(balance)} USDC`);
}
```
Output:
```
Maker: PSM-USDC-A is holding 2016607719400274 USDC
Polygon (Matic): ERC20 Bridge is holding 637027784047075 USDC
Arbitrum One: L1 Arb - Custom Gateway is holding 1352989279461167 USDC
Binance 14 is holding 132410706717295 USDC

```
You can even use `singleCall` for batching:
```ts
async function multicallCall2(userAddresses: Address[]) {
  return await Promise.all(userAddresses.map(singleCall));
}
```
### Result caching

`Multicall#wrap` will only wrap each contract *once*. If the same contract is called with the same multicall instance, the cached result will be returned. The cached result is stored in `Multicall#cacheWrappedContract` weakMap. To access the cached result, you can get from the `cacheWrappedContract` weakMap of the `multicall` instance. For example, we can get the cache result of the above USDC `contract` instance as follows:
```ts
const cachedResult = contract[multicall.multicallStaticSymbol];
console.log(cachedResult);
console.log(cachedResult === contractWithMulticall);
```
Output:
```
{
  callStatic: {
    allowance: [Function (anonymous)],
    approve: [Function (anonymous)],
    balanceOf: [Function (anonymous)],
    decimals: [Function (anonymous)],
    name: [Function (anonymous)],
    symbol: [Function (anonymous)],
    totalSupply: [Function (anonymous)],
    transfer: [Function (anonymous)],
    transferFrom: [Function (anonymous)]
  }
}
true

```
**Note**: the `Multicall#multicallStaticSymbol` is not *static*. It is local to each `multicall` instance.

### Let the user decides whether to use Multicall

It is also `Multicall.wrap` function, that accepts an optional parameter `Multicall?`. If it is undefined, the calling method will act just like `callStatic`, that is, no multicall!
```ts
async function singleCallOptional(userAddress: Address, multicall?: Multicall) {
  return await Multicall.wrap(contract, multicall).callStatic.balanceOf(userAddress);
}

async function multicallCallOptional(userAddresses: Address[], multicall?: Multicall) {
  return await Promise.all(userAddresses.map(
    (userAddress) => singleCallOptional(userAddress, multicall)
  ));
}

// have batching
const balances1 = await multicallCallOptional(Object.values(USDC_HOLDERS), multicall);
// no batching
const balances2 = await multicallCallOptional(Object.values(USDC_HOLDERS));

console.log(balances1);
console.log(balances2);
```
Output:
```
[
  BigNumber { value: "2016607719400274" },
  BigNumber { value: "637027784047075" },
  BigNumber { value: "1352989279461167" },
  BigNumber { value: "132410706717295" }
]
[
  BigNumber { value: "2016607719400274" },
  BigNumber { value: "637027784047075" },
  BigNumber { value: "1352989279461167" },
  BigNumber { value: "132410706717295" }
]

```