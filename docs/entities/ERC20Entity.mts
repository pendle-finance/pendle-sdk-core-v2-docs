/* ===
# ERC20 entity

---

The class that represents a `ERC20` token, with Pendle SDK functionalities such as Multicall and MetaMethod. Please see [ERC20 tutorial with Pendle SDK](../erc20-tutorial.md) for example usage, as well as details explanation of this class.

## Utility types

### type `ERC20EntityConfig`
=== */

import { ERC20EntityConfig, PendleEntityConfigOptionalAbi } from '@pendle/sdk-v2';

/* ===
```ts
type ERC20EntityConfig = PendleEntityConfigOptionalAbi;
```

The configuration for an `ERC20` entity. As `ERC20Entity` extends `PendleEntity`, its config should be the subtype of `PendleEntity`'s config type. See [PendleEntity](./PendleEntity.mts.md).

## class `ERC20Entity`
=== */

import { ERC20Entity, PendleEntity, ERC20Like } from '@pendle/sdk-v2';

/* ===

```ts
class ERC20Entity extends PendleEntity implements ERC20Like;
```

See [PendleEntity](./PendleEntity.mts.md)

### `constructor()`

```ts
constructor(address: Address, config: ERC20EntityConfig);
```

### Properties and methods

#### `address`
```ts
readonly address: Address
```
The contract address

#### `contract`
```ts
get contract(): WrappedContract<PendleERC20>;
```
The **typed** wrapped contract object of the entity.

#### `allowance(...)`
```ts
allowance(owner: Address, spender: Address, params?: MulticallStaticParams): Promise<BN>;
```

Execute ERC20's `allowance` method.

##### Parameters
- `owner`: [Address] - the owner of the asset.
- `spender`: [Address] - the spender to query.
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
The allowance of the `spender`.

[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md

#### `balanceOf(...)`
```ts
balanceOf(account: Address, params?: MulticallStaticParams): Promise<BN>
```

Execute ERC20's `allowance` method.

##### Parameters
- `account`: [Address] - the account.
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
The balance of the `account`.

[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md

#### `decimals(...)`
```ts
decimals(params?: MulticallStaticParams): Promise<number>
```

Execute ERC20's `decimals` method.

##### Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
The `decimals` of the `token`.

[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md

#### `name(...)`
```ts
name(params?: MulticallStaticParams): Promise<string>
```

Execute ERC20's `name` method.

##### Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
The `name` of the `token`.

[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md

#### `symbol(...)`
```ts
symbol(params?: MulticallStaticParams): Promise<string> {
```

Execute ERC20's `symbol` method.

##### Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
The `symbol` of the `token`.

[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md

#### `totalSupply(...)`
```ts
totalSupply(params?: MulticallStaticParams): Promise<string> {
```

Execute ERC20's `totalSupply` method.

##### Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
The `totalSupply` of the `token`.

[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md

#### `approve(...)`
```ts
approve<T extends MetaMethodType>(
    spender: Address,
    amount: BigNumberish,
    params: MetaMethodExtraParams<T> = {}
): ERC20EntityMetaMethodReturnType<T, 'approve'>;
```

##### Type parameters
- `T` extends [MetaMethodType]: The type of the meta method. This should be infer by `tsc` to determine the correct return type. See [ERC20 contract interaction tutorial with Pendle SDK][ERC20-tutorial] to see the example usage with explanation. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Parameters
- `spender`: [Address] - the spender's Address.
- `amount`: `ethers.BigNumberish` - the amount to approve.
- `params?`: [MetaMethodExtraParams<T>][MetaMethodExtraParams] - the additional parameters for **write** method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
When `params` is not defined, or when `params.method` is not defined, this method will perform the transaction, and return `Promise<ethers.ContractTransaction>`.

Otherwise, `params.method`'s value is used to determine the return type:
- for `'send'`, this method will perform the transaction, and return `Promise<ethers.ContractTransaction>`.
- for `'estimateGas'`, this method will estimate the gas required to send the transaction, and return `Promise<BN>`.
- for `'callStatic'` and `'multicallStatic'`, this method will 
ask a node to perform the contract method, and return the result, without changing the contract's state, then return **`Promise<boolean>`** - wether or not the approval is successful.
- for `meta-method`, this method will just perform the required calculation, and return `Promise<ContractMetaMethod<C, 'methodName', MetaMethodExtraParams<T>>>`. The `data` field of the awaited result is a copy of `params`, and will have the following fields:
    - `multicall?`: [Multicall] - the multicall instance.
    - `overrides?`: `ethers.CallOverrides` - the overrides. This can overridden with `params.overrides`.
    - `method`: The meta-method type. In this case it will be `meta-method`, the same value as `params.method`.




[MetaMethodType]: ../WrappedContract.mts.md
[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md
[MetaMethodExtraParams]: ../WrappedContract.mts.md
[Multicall]: ../Multicall.mts.md
[ERC20-tutorial]: ../erc20-tutorial.mts.md

#### `transfer(...)`
```ts
transfer<T extends MetaMethodType>(
    to: Address,
    amount: BigNumberish,
    params: MetaMethodExtraParams<T> = {}
): ERC20EntityMetaMethodReturnType<T, 'transfer'>;
```

##### Type parameters
- `T` extends [MetaMethodType]: The type of the meta method. This should be infer by `tsc` to determine the correct return type. See [ERC20 contract interaction tutorial with Pendle SDK][ERC20-tutorial] to see the example usage with explanation. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Parameters
- `to`: [Address] - the receiver's Address.
- `amount`: `ethers.BigNumberish` - the amount to transfer.
- `params?`: [MetaMethodExtraParams<T>][MetaMethodExtraParams] - the additional parameters for **write** method. See [WrappedContract](../WrappedContract.mts.md) for more details.

##### Returns
When `params` is not defined, or when `params.method` is not defined, this method will perform the transaction, and return `Promise<ethers.ContractTransaction>`.

Otherwise, `params.method`'s value is used to determine the return type:
- for `'send'`, this method will perform the transaction, and return `Promise<ethers.ContractTransaction>`.
- for `'estimateGas'`, this method will estimate the gas required to send the transaction, and return `Promise<BN>`.
- for `'callStatic'` and `'multicallStatic'`, this method will 
ask a node to perform the contract method, and return the result, without changing the contract's state, then return **`Promise<boolean>`** - wether or not the approval is successful.
- for `meta-method`, this method will just perform the required calculation, and return `Promise<ContractMetaMethod<C, 'methodName', MetaMethodExtraParams<T>>>`. The `data` field of the awaited result is a copy of `params`, and will have the following fields:
    - `multicall?`: [Multicall] - the multicall instance.
    - `overrides?`: `ethers.CallOverrides` - the overrides. This can overridden with `params.overrides`.
    - `method`: The meta-method type. In this case it will be `meta-method`, the same value as `params.method`.




[MetaMethodType]: ../WrappedContract.mts.md
[Address]: ../utilities-types-and-functions.mts.md
[MulticallStaticParams]: ../WrappedContract.mts.md
[MetaMethodExtraParams]: ../WrappedContract.mts.md
[Multicall]: ../Multicall.mts.md
[ERC20-tutorial]: ../erc20-tutorial.mts.md
=== */