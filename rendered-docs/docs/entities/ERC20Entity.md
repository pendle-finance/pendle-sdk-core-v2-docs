# ERC20 entity

---

The class that represents a `ERC20` token, with Pendle SDK functionalities such as Multicall and MetaMethod. Please see [ERC20 tutorial with Pendle SDK](../erc20-tutorial.md) for example usage, as well as details explanation of this class.

## Utility types

### type `ERC20Config`

```typescript
import { ERC20Config, PendleEntityConfig } from '@pendle/sdk-v2';
```

```ts
type ERC20Config = PendleEntityConfig;
```

The configuration for an `ERC20` entity. As `ERC20` extends `PendleEntity`, its config should be the subtype of `PendleEntity`'s config type. See [PendleEntity](./PendleEntity.md).

## class `ERC20`

```typescript
import { ERC20, PendleEntity } from '@pendle/sdk-v2';
```

```ts
class ERC20 extends PendleEntity;
```

See [PendleEntity](./ERC20Entity.md)

### `constructor()`

```ts
constructor(address: Address, config: ERC20Config)
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

Parameters
- `owner`: [Address] - the owner of the asset.
- `spender`: [Address] - the spender to query.
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the allowance of the `spender`.

[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md

#### `balanceOf(...)`
```ts
balanceOf(account: Address, params?: MulticallStaticParams): Promise<BN>
```

Execute ERC20's `allowance` method.

Parameters
- `account`: [Address] - the account.
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the balance of the `account`.

[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md

#### `decimals(...)`
```ts
decimals(params?: MulticallStaticParams): Promise<number>
```

Execute ERC20's `decimals` method.

Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the `decimals` of the `token`.

[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md

#### `name(...)`
```ts
name(params?: MulticallStaticParams): Promise<string>
```

Execute ERC20's `name` method.

Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the `name` of the `token`.

[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md

#### `symbol(...)`
```ts
symbol(params?: MulticallStaticParams): Promise<string> {
```

Execute ERC20's `symbol` method.

Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the `symbol` of the `token`.

[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md

#### `totalSupply(...)`
```ts
totalSupply(params?: MulticallStaticParams): Promise<string> {
```

Execute ERC20's `totalSupply` method.

Parameters
- `params?`: [MulticallStaticParams] - the additional parameters for read method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the `totalSupply` of the `token`.

[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md

#### `approve(...)`
```ts
approve<T extends MetaMethodType>(
    spender: Address,
    amount: BigNumberish,
    params: MetaMethodExtraParams<T> = {}
)
```

Execute ERC20's `approve` method.

Type parameters:
- `T` extends [MetaMethodType]: The type of the meta method. This should be infer by `tsc` to determine the correct return type. See [ERC20 contract interaction tutorial with Pendle SDK][ERC20-tutorial] to see the example usage with explanation. See [WrappedContract](../WrappedContract.md) for more details.

Parameters
- `params?`: [MetaMethodExtraParams<T>][MetaMethodExtraParams] - the additional parameters for **write** method. See [WrappedContract](../WrappedContract.md) for more details.

Returns: the `totalSupply` of the `token`.

[MetaMethodType]: ../WrappedContract.md
[Address]: ../utilities-types-and-functions.md
[MulticallStaticParams]: ../WrappedContract.md
[MetaMethodExtraParams]: ../WrappedContract.md
[ERC20-tutorial]: ../erc20-tutorial.md