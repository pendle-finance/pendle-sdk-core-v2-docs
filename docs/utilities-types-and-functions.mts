/* ===
# Utilities types and functions

---

## Used external types and functions

We use some external packages, mainly `ethers`. So before reading further, please be sure that you are familiar with them first.
=== */

import type { providers, Signer } from 'ethers';

type Provider = providers.Provider;

// these are exported to @pendle/sdk-v2
// export { BigNumber as BN, BigNumberish } from 'ethers';

/* ===
## type `Address`
=== */

import { Address } from '@pendle/sdk-v2';

/* ===
```ts
  type Address = `0x${string}`;
```
=== */

/* ===
In Pendle SDK, we force `Address` to be a string that has `0x` as its prefix. It is used to avoid direct assignment from a string to an Address.

# function `toAddress(...)`
=== */

import { toAddress } from '@pendle/sdk-v2';

/* ===
```ts
function toAddress(rawAddress: string): Address
```
_Cast_ a rawAddress to the `Address` type. This function **does not** validate the `rawAddress` string. The resulting `Address` will be transformed to lowercase.

## function `isSameAddress(...)`
=== */

import { isSameAddress } from '@pendle/sdk-v2';

/* ===
```ts
function isSameAddress(address1: Address, address2: Address): boolean;
```
Check if two addresses are the same, by comparing them in **lowercase**.

## type `ChainId`
=== */

import { ChainId } from '@pendle/sdk-v2';

/* ===
```tsx
type ChainId = 1 | 43113 | 80001 | 43114;
```
This type is a union of the chains’ IDs that are supported by Pendle.

## type `MainchainId`
=== */

import { MainchainId } from '@pendle/sdk-v2';

/* ===
```tsx
type MainchainId = 1 | 43113;
```

This type is a union of the main chains’ IDs that are supported by Pendle.

## function `isMainchain(...)`
=== */

import { isMainchain } from '@pendle/sdk-v2';

/* ===
```tsx
export function isMainchain(chainId: ChainId): chainId is MainchainId;
```

Check if a `ChainId` a `MainchainId`

### Examples
=== */

console.log(isMainchain(1));

console.log(isMainchain(43114));

/* ===
## type `NetworkConnection`
=== */

import { NetworkConnection } from '@pendle/sdk-v2';

/* ===
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
=== */

import { getDefaultProvider, Wallet } from 'ethers';

const provider = getDefaultProvider();
const signer = Wallet.createRandom();

// ok examples
const nc1: NetworkConnection = { provider };
const nc2: NetworkConnection = { signer };
const nc3: NetworkConnection = { provider, signer};

// not ok example
// const nc4: NetworkConnection = {};

/* ===
## function `copyNetworkConnection(..)`
=== */

import { copyNetworkConnection } from '@pendle/sdk-v2';

/* ===
```typescript
export function copyNetworkConnection(networkConnection: NetworkConnection): NetworkConnection;
```

This function **only** copies the `provide` and the `signer` fields of the input object.

### Example
=== */

const nc5 = { provider, aRandomField: 'foo' };
const nc6 = copyNetworkConnection(nc5);
// Print the keys of nc2
console.log(Object.keys(nc6));

/* ===
## type `ContractLike<T>`
=== */

import { ContractLike } from '@pendle/sdk-v2';

/* ===

```tsx
type ContractLike<T extends Contract = Contract> = T | WrappedContract<T>;
```

See this type in [Pendle SDK’s WrappedContract](./WrappedContract.mts.md)
=== */