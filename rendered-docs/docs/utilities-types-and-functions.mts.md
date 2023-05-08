
# Utilities types and functions

---

## Used external types and functions

We use some external packages, mainly `ethers`. So before reading further, please be sure that you are familiar with them first.
```ts
import type { providers, Signer } from 'ethers';

type Provider = providers.Provider;

// these are exported to @pendle/sdk-v2
// export { BigNumber as BN, BigNumberish } from 'ethers';
```
## type `Address`
```ts
import { Address } from '@pendle/sdk-v2';
```
```ts
  type Address = `0x${string}`;
```

In Pendle SDK, we force `Address` to be a string that has `0x` as its prefix. 
This type is defined to avoid using raw string as address.
The address returned by a contract call often have mixed cases, which sometimes causes bug in comparison. Even though it only checks if the string begins with `0x`, we are still sure that the address is not a raw string. Use `toAddress` to convert a raw address to this type.

# function `toAddress(...)`
```ts
import { toAddress } from '@pendle/sdk-v2';
```
```ts
function toAddress(rawAddress: string): Address
```
_Cast_ a rawAddress to the `Address` type. This function **does not** validate the `rawAddress` string. The resulting `Address` will be transformed to lowercase.

## function `isSameAddress(...)`
```ts
import { isSameAddress } from '@pendle/sdk-v2';
```
```ts
function isSameAddress(address1: Address, address2: Address): boolean;
```
Check if two addresses are the same, by comparing them in **lowercase**.

## type `ChainId`
```ts
import { ChainId } from '@pendle/sdk-v2';
```
```tsx
type ChainId = 1 | 43113 | 80001 | 43114;
```
This type is a union of the chains’ IDs that are supported by Pendle.

## type `MainchainId`
```ts
import { MainchainId } from '@pendle/sdk-v2';
```
```tsx
type MainchainId = 1 | 43113;
```

This type is a union of the main chains’ IDs that are supported by Pendle.

## function `isMainchain(...)`
```ts
import { isMainchain } from '@pendle/sdk-v2';
```
```tsx
export function isMainchain(chainId: ChainId): chainId is MainchainId;
```

Check if a `ChainId` a `MainchainId`

### Examples
```ts
console.log(isMainchain(1));

console.log(isMainchain(43114));
```
Output:
```
true
false

```
## type `NetworkConnection`
```ts
import { NetworkConnection } from '@pendle/sdk-v2';
```
```tsx
export type NetworkConnection =
    | { provider: Provider; signer?: undefined }
    | { provider?: undefined; signer: Signer }
    | { provider: Provider; signer: Signer };
```

This type looks complicated, but it actually has only two fields:

- `provider: Provider`
- `signer: Signer`

It is written so so that one of the fields can be omitted, **but not both!** Also, we strongly recommend using `tsc` with `strict` mode.

### Example
```ts
import { Wallet } from 'ethers';
import { provider } from './playground.mjs';

const signer = Wallet.createRandom();

// ok examples
const nc1: NetworkConnection = { provider };
const nc2: NetworkConnection = { signer };
const nc3: NetworkConnection = { provider, signer};

// not ok example
// const nc4: NetworkConnection = {};
```
## function `copyNetworkConnection(..)`
```ts
import { copyNetworkConnection } from '@pendle/sdk-v2';
```
```typescript
export function copyNetworkConnection(networkConnection: NetworkConnection): NetworkConnection;
```

This function **only** copies the `provide` and the `signer` fields of the input object.

### Example
```ts
const nc5 = { provider, aRandomField: 'foo' };
const nc6 = copyNetworkConnection(nc5);
// Print the keys of nc2
console.log(Object.keys(nc6));
```
Output:
```
[ 'provider', 'signer' ]

```
## type `ContractLike<T>`
```ts
import { ContractLike } from '@pendle/sdk-v2';
```
```tsx
type ContractLike<T extends Contract = Contract> = T | WrappedContract<T>;
```

See this type in [Pendle SDK’s WrappedContract](./WrappedContract.mts.md)
