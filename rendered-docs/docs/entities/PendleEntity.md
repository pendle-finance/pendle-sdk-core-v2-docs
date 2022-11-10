# PendleEntity

--- 

This is the base class of all entities class of Pendle SDK. It is not intended to be used directly, but to be overridden.

## Example subclass

Here is a small example to create a custom subclass of `PendleEntity`.

```typescript
import {
    // PendleEntity
    PendleEntity, PendleEntityConfigOptionalAbi,

    // ERC20 typechain type and abi, with WrappedContract type
    PendleERC20, PendleERC20ABI, WrappedContract,

    // Types for parameters
    Address, ChainId, BigNumberish, BN,

    // MulticallStaticParams for read-methods
    MulticallStaticParams,

    // Meta method related types for write-methods
    MetaMethodType, MetaMethodExtraParams
} from '@pendle/sdk-v2';

/**
 * Override the config
 */
export type MyERC20Config = PendleEntityConfigOptionalAbi;


class MyERC20 extends PendleEntity {
    constructor(
        readonly address: Address,
        readonly chainId: ChainId,
        config: MyERC20Config   // use the custom config
    ) {
        super(
            address,
            chainId,
            {
                // passing in the abi
                // but does not overwrite the abi of the config
                abi: PendleERC20ABI,
                ...config
            });
    }

    /**
     * Override the getter to return the correct type with type case
     */
    get contract(): WrappedContract<PendleERC20> {
        return this._contract as WrappedContract<PendleERC20>;
    }

    /**
     * Example read method
     */
    allowance(
        // required params
        owner: Address,
        spender: Address,

        // read methods should mostly be used with multicall
        // via `this.contract.multicallStatic`. Hence this param
        params?: MulticallStaticParams & { /* your custom param here */ }
    ): Promise<BN> {
        return this.contract.multicallStatic.allowance(
            owner,
            spender,
            params   // remember to pass in params
        );
    }

    /**
     * Example write method
     * Read methods should be used with meta method.
     * The type parameter T is required so tsc can detect the correct return type
     * 
     * Meta method often has complex return type, so we can left tsc to determine the return type for us.
     * 
     * But in this case, the return type will be
     * 
     *  RouterMetaMethodReturnType<T, PendleERC20, 'approve', MetaMethodExtraParams<T>>
     */

    async approve<T extends MetaMethodType>(
        // required params
        spender: Address,
        amount: BigNumberish,

        // overall params for meta method
        params: MetaMethodExtraParams<T> & { /* your custom params here */ } = {}
    ) {
        return this.contract.metaCall.approve(
            spender,
            amount,
            this.addExtraParams(params)      // remember to pass in params
        );
    }
}

```

## Utility types

### `type PendleEntityConfigOptionalAbi`

```typescript
import { PendleEntityConfigOptionalAbi } from '@pendle/sdk-v2';
```

```ts
type PendleEntityConfigOptionalAbi = NetworkConnection & {
    multicall?: Multicall;
    abi?: ContractInterface;
};
```

This type is used base configuration for a `PendleEntity`, but is mainly used for the subclass of `PendleEntity`, as the subclass will pass its contract ABI to the class `PendleEntity`.

See `NetworkConnection` in [Utilities types and functions](https://www.notion.so/Utilities-types-and-functions-3c28e12657514a01884d29ce0faae4e6).

Pass in `Multicall` to use contract methods with `Multicall` (via `multicallStatic`).

### `type PendleEntityConfig`

```typescript
import { PendleEntityConfig } from '@pendle/sdk-v2';
```

```ts
type PendleEntityConfig = PendleEntityConfigOptionalAbi & {
    abi: ContractInterface;
};
```

This is the same type as `PendleEntityConfigOptionalAbi`, but with forced ABI.

## `class PendleEntity`

```typescript
import { PendleEntity } from '@pendle/sdk-v2';
```

```ts
class PendleEntity;
```

### constructor

```tsx
constructor(
	address: Address,
	chainId: ChainId,
	config: PendleEntityConfig
)
```

Parameters:

- `address: Address` — The inner contract address
- `chainId: ChainId` — The chain’s ID of the contract. See `ChainId` type in [Utilities types and functions](../utilities-types-and-functions.nnb).
- `config: PendleEntityConfig` — the configuration.


### Properties and methods

#### `_contract`
```ts
protected readonly _contract: WrappedContract
```

The _wrapped_ contract that the entity is holding. This should not be used directly. Instead the getter `contract` should be used to have the correct _type_ of the wrapped contract.

See [`WrappedContract`](../WrappedContract.nnb).

#### `contract`
```ts
get contract(): WrappedContract
```
This getter returns `this._contract` but with the casted type. It is intended to be overridden in the subclasses.

#### `multicall`
```ts
readonly multicall?: Multicall;
```

The `Multicall` instance used by this entity. See [`Multicall`](TODO) <span style='color: red'>TODO link</span>

#### `networkConnection`

```ts
readonly networkConnection: NetworkConnection;
```

The `networkConnection` of this entity. See [Utilities types and functions](../utilities-types-and-functions.nnb).

#### `entityConfig`
```
get entityConfig(): PendleEntityConfigOptionalAbi;
```

This getter returns the config of the current entity. It can be used to pass as configuration for a new entity. It should be overridden in the subclass.

#### `getDefaultMetaMethodExtraParam()`

```ts
getDefaultMetaMethodExtraParams<T extends MetaMethodType>(): MetaMethodExtraParams<T>;
```

**Please see [`WrappedContract`](../WrappedContract.nnb) first.**

Return the set of parameters for an entity's write-method (that will do a `metaCall`). It should be overridden in the subclass.

#### `addExtraParams`

```ts
addExtraParams<T extends MetaMethodType>(params: MetaMethodExtraParams<T>): MetaMethodExtraParams<T>;
```

**Please see [`WrappedContract`](../WrappedContract.nnb) first.**

Merge user-defined parameters with the default parameters (from `getDefaultMetaMethodExtraParam()`) and return the result to use use in a write method.