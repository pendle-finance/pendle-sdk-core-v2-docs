_**Caution**_: In this notebook, we are using a dummy address. If you wish to see a more natural result without the risk of losing money, please specify your own address and change the chain ID to testnet ID (for example, `43113` for Fuji).

---

There are a few kinds of entities in Pendle SDK, and ERC20 is one of them. The entities have similar functionalities, and ERC20 is the most straightforward and common entity. So let’s take a look at Pendle SDK’s functionalities with ERC20.

# Entity creation

Let’s say we want to interact with the USDC contract on Ethereum. USDC contract has address `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`, and Ethereum has the chain ID of `1`.

```typescript
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const chainId = 1;
```

To communicate with the contract, we also need a provider and/or signer.

```typescript
import { Wallet, getDefaultProvider } from 'ethers';

const dummyMnemonic = 'test test test test test test test test test test test junk';

const provider = getDefaultProvider();
const wallet = Wallet.fromMnemonic(dummyMnemonic).connect(provider);
const signer = wallet;
```

 With this information, we can create an ERC20 entity as follows

```typescript
import { ERC20 } from '@pendle/sdk-v2';


// ERC20 entity with read-only functionalities
const readonlyErc20 = new ERC20(USDCAddress, chainId, { provider });

// ERC20 entity with read-write functionalities
const readWriteErc20 = new ERC20(USDCAddress, chainId, { signer });
```

Other entities have roughly the same constructor signature: 
- the contract address,
- the network chain ID, and
- the network connection.

The chain ID parameter should satisfy the type `ChainId`, a union of the supported chain ID number. The `ChainId` type is specified as follows:

```ts
type ChainId = 1 | 43113 | 80001 | 43114;
```

The network connection parameter should be an object that has either the property provider: `ethers.providers.Provider`, or `signer: ethers.Signer`. Pass signer if all contract functionalities are required. Otherwise, just pass in a provider. If both provider and signer are presented, the signer must be connected to the passed-in provider (an error will be thrown otherwise).

```typescript
const provider = getDefaultProvider();
const unconnectedWallet = Wallet.createRandom();
const connectedWallet = unconnectedWallet.connect(provider);

const contractAddress = USDCAddress;

// The following constructions work fine
new ERC20(contractAddress, chainId, { provider });
new ERC20(contractAddress, chainId, { signer: connectedWallet });
new ERC20(contractAddress, chainId, { signer: unconnectedWallet });
new ERC20(contractAddress, chainId, { provider, signer: connectedWallet });

// The following construction will throw an error
try {
    new ERC20(contractAddress, chainId, { provider, signer: unconnectedWallet });  // Error
} catch (e) {
    console.log('Got error');
    console.log(e);
}
```

Outputs:

<pre><code>Got error
PendleSdkError: For contract creation, networkConnection.provider should be the same as networkConnection.signer.provider
    at createContractObject (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/contracts/createContractObject.ts:159:15)
    at new PendleEntity (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/entities/PendleEntity.ts:31:26)
    at new ERC20 (/home/darkkcyan/projects/pendle-sdk-core-v2-docs/node_modules/@pendle/sdk-v2/src/entities/ERC20.ts:11:9)
    at <Cell 12> [15, 13]
    at <Cell 12> [18, 46]
    at Script.runInContext (node:vm:141:12)
    at Script.runInNewContext (node:vm:146:17)
    at Object.runInNewContext (node:vm:306:38)
    at C (/home/darkkcyan/.vscode-oss/extensions/donjayamanne.typescript-notebook-2.0.6/out/extension/server/index.js:2:113345)
    at t.execCode (/home/darkkcyan/.vscode-oss/extensions/donjayamanne.typescript-notebook-2.0.6/out/extension/server/index.js:2:114312)

</code></pre><br>

# Read-only functions

An `ERC20` has the following read-only functions:
```solidity
function name() public view returns (string);
function symbol() public view returns (string);
function decimals() public view returns (uint8);
function totalSupply() public view returns (uint256);
function balanceOf(address _owner) public view returns (uint256 balance);
function allowance(address _owner, address _spender) public view returns (uint256 remaining);
```

You can use these functions similarly to calling them in a contract:

```typescript
import { Address } from '@pendle/sdk-v2';

async function readonlyFunctionsExample(erc20: ERC20, ownerAddress: Address, spenderAddress: Address) {
    const name = await erc20.name();
    const symbol = await erc20.symbol();
    
    // convert ethersjs' BigNumber to string for readability
    const decimals = (await erc20.decimals()).toString();
    const totalSupply = (await erc20.totalSupply()).toString();
    const balanceOf = (await erc20.balanceOf(ownerAddress)).toString();
    const allowance = (await erc20.allowance(ownerAddress, spenderAddress)).toString();
    return {ownerAddress, spenderAddress, name, symbol, decimals, totalSupply, balanceOf, allowance };
}
```

To demonstrate the usage of the example, we need addresses of an owner and a spender. For example, we can use the address of [this transaction](https://etherscan.io/tx/0x5678b37a0acda9b248d242173b9a43a869b8ff81ee6d9b8f4ec387cf640edc65):


```typescript
const ownerAddress: Address = '0x5cb656d7605d9924c085fc859585f3ff2f7ad08f';
const spenderAddress: Address = '0x221b0a202d7926fc1b9257310b5a16592f2ab852';
```

```typescript
await readonlyFunctionsExample(readonlyErc20, ownerAddress, spenderAddress);
```

Outputs:

<pre><code>========= NOTICE =========
Request-Rate Exceeded  (this message will not be repeated)

The default API keys for each service are provided as a highly-throttled,
community resource for low-traffic projects and early prototyping.

While your application will continue to function, we highly recommended
signing up for your own API keys to improve performance, increase your
request rate/limit and enable other perks, such as metrics and advanced APIs.

For more details: https://docs.ethers.io/api-keys/
==========================

</code></pre><br>

<pre><code>{
  ownerAddress: <span style="color:#0A0">'0x5cb656d7605d9924c085fc859585f3ff2f7ad08f'<span style="color:#FFF">,
  spenderAddress: <span style="color:#0A0">'0x221b0a202d7926fc1b9257310b5a16592f2ab852'<span style="color:#FFF">,
  name: <span style="color:#0A0">'USD Coin'<span style="color:#FFF">,
  symbol: <span style="color:#0A0">'USDC'<span style="color:#FFF">,
  decimals: <span style="color:#0A0">'6'<span style="color:#FFF">,
  totalSupply: <span style="color:#0A0">'38612653556139550'<span style="color:#FFF">,
  balanceOf: <span style="color:#0A0">'0'<span style="color:#FFF">,
  allowance: <span style="color:#0A0">'0'<span style="color:#FFF">
}</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>
</code></pre><br>

The function `readonlyFunctionsExample` sends the calls _sequentially_. To send the all the calls to the provider at the same time, use `Promise.all`.

```typescript
async function readonlyFunctionExamplePromiseAll(erc20: ERC20, ownerAddress: string, spenderAddress: string) {
    const [name, symbol, decimals, totalSupply, balanceOf, allowance] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        
        // convert ethersjs' BigNumber to string for readability
        erc20.decimals().then(String),
        erc20.totalSupply().then(String),
        erc20.balanceOf(ownerAddress).then(String),
        erc20.allowance(ownerAddress, spenderAddress).then(String),
    ]);
    return {ownerAddress, spenderAddress, name, symbol, decimals, totalSupply, balanceOf, allowance };
}
```

```typescript
await readonlyFunctionExamplePromiseAll(readonlyErc20, ownerAddress, spenderAddress);
```

Outputs:

<pre><code>{
  ownerAddress: <span style="color:#0A0">'0x5cb656d7605d9924c085fc859585f3ff2f7ad08f'<span style="color:#FFF">,
  spenderAddress: <span style="color:#0A0">'0x221b0a202d7926fc1b9257310b5a16592f2ab852'<span style="color:#FFF">,
  name: <span style="color:#0A0">'USD Coin'<span style="color:#FFF">,
  symbol: <span style="color:#0A0">'USDC'<span style="color:#FFF">,
  decimals: <span style="color:#0A0">'6'<span style="color:#FFF">,
  totalSupply: <span style="color:#0A0">'38612653556139550'<span style="color:#FFF">,
  balanceOf: <span style="color:#0A0">'0'<span style="color:#FFF">,
  allowance: <span style="color:#0A0">'0'<span style="color:#FFF">
}</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>
</code></pre><br>

## Multicall support

Pendle SDK supports calling read-only functions with [Multicall](https://github.com/makerdao/multicall) by makerdao. Multicall is the preferred way to call multiple contract methods at once to reduce the round trips over the network. To use multicall, first create a Multicall instance as follows:

```typescript
import { Multicall } from '@pendle/sdk-v2';

const multicall = new Multicall({ chainId: chainId, provider: provider });
```

`chainId` and `provider` are the required parameters. There are two more optional parameters:

- `callLimit: number` (default: `64`), the maximum number of calls per multicall request.
- `blockTag: string` (default: `latest`), the block tag for the multicall requests.

### Passing multicall to entity constructor

ERC20 entity’s contractor’s third parameter also accept multicall. You can pass in `multicall` to ERC20 as follows:

```typescript
const readonlyErc20WithMulticall = new ERC20(USDCAddress, chainId, { provider: provider, multicall: multicall });
```

After that, you can use it as in readonlyFunctionExamplePromiseAll, and Pendle SDK will handle the batching for you:

```typescript
await readonlyFunctionExamplePromiseAll(readonlyErc20WithMulticall, ownerAddress, spenderAddress);
```

Outputs:

<pre><code>{
  ownerAddress: <span style="color:#0A0">'0x5cb656d7605d9924c085fc859585f3ff2f7ad08f'<span style="color:#FFF">,
  spenderAddress: <span style="color:#0A0">'0x221b0a202d7926fc1b9257310b5a16592f2ab852'<span style="color:#FFF">,
  name: <span style="color:#0A0">'USD Coin'<span style="color:#FFF">,
  symbol: <span style="color:#0A0">'USDC'<span style="color:#FFF">,
  decimals: <span style="color:#0A0">'6'<span style="color:#FFF">,
  totalSupply: <span style="color:#0A0">'38612653556139550'<span style="color:#FFF">,
  balanceOf: <span style="color:#0A0">'0'<span style="color:#FFF">,
  allowance: <span style="color:#0A0">'0'<span style="color:#FFF">
}</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>
</code></pre><br>

Note that `readonlyFunctionsExample` will not work with multicall, as the methods are called sequentially. If used with an ERC20 entity that is initialized with a multicall instance, each call will be a multicall request with a single call inside instead!

### Passing multicall to the methods

If an ERC20 entity was not initialized with `multicall`, it can still be called with multicall by passing the `multicall` instance to the methods as the last parameter:

```typescript
async function readonlyFunctionExample_multicallToMethods(
    erc20: ERC20,
    ownerAddress: string,
    spenderAddress: string,
    multicall?: Multicall
) {
    const [name, symbol, decimals, totalSupply, balanceOf, allowance] = await Promise.all([
        erc20.name({ multicall }),
        erc20.symbol({ multicall }),
        
        // convert ethersjs' BigNumber to string for readability
        erc20.decimals({ multicall }).then(String),
        erc20.totalSupply({ multicall }).then(String),
        erc20.balanceOf(ownerAddress, { multicall }).then(String),
        erc20.allowance(ownerAddress, spenderAddress, { multicall }).then(String),
    ]);
    return {ownerAddress, spenderAddress, name, symbol, decimals, totalSupply, balanceOf, allowance };
}
```

```typescript
await readonlyFunctionExample_multicallToMethods(
    readonlyErc20WithMulticall,
    ownerAddress,
    spenderAddress,
    multicall
);
```

Outputs:

<pre><code>{
  ownerAddress: <span style="color:#0A0">'0x5cb656d7605d9924c085fc859585f3ff2f7ad08f'<span style="color:#FFF">,
  spenderAddress: <span style="color:#0A0">'0x221b0a202d7926fc1b9257310b5a16592f2ab852'<span style="color:#FFF">,
  name: <span style="color:#0A0">'USD Coin'<span style="color:#FFF">,
  symbol: <span style="color:#0A0">'USDC'<span style="color:#FFF">,
  decimals: <span style="color:#0A0">'6'<span style="color:#FFF">,
  totalSupply: <span style="color:#0A0">'38612653556139550'<span style="color:#FFF">,
  balanceOf: <span style="color:#0A0">'0'<span style="color:#FFF">,
  allowance: <span style="color:#0A0">'0'<span style="color:#FFF">
}</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>
</code></pre><br>

Again, Pendle SDK will handle all the batching. And also `readonlyFunctionsExample` will also not work for the same reason as above.

When `multicall` parameter is `undefined`, it will have the same effect as `readonlyFunctionExamplePromiseAll` (without `multicall`).

```typescript
await readonlyFunctionExample_multicallToMethods(
    readonlyErc20WithMulticall,
    ownerAddress,
    spenderAddress
    // No multicall here
);
```

Outputs:

<pre><code>{
  ownerAddress: <span style="color:#0A0">'0x5cb656d7605d9924c085fc859585f3ff2f7ad08f'<span style="color:#FFF">,
  spenderAddress: <span style="color:#0A0">'0x221b0a202d7926fc1b9257310b5a16592f2ab852'<span style="color:#FFF">,
  name: <span style="color:#0A0">'USD Coin'<span style="color:#FFF">,
  symbol: <span style="color:#0A0">'USDC'<span style="color:#FFF">,
  decimals: <span style="color:#0A0">'6'<span style="color:#FFF">,
  totalSupply: <span style="color:#0A0">'38612653556139550'<span style="color:#FFF">,
  balanceOf: <span style="color:#0A0">'0'<span style="color:#FFF">,
  allowance: <span style="color:#0A0">'0'<span style="color:#FFF">
}</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>
</code></pre><br>

# Write functions

**Caution**: The following functions might modify the contract state. To prevent this, we define the following variable. Set it to true to run the write methods. As we are using Typescript, the example is guaranteed to have the correct typing.

```typescript
const ACTUALLY_RUN_WRITE_FUNCTION = false;
```

```typescript
function guardWrite<A extends any[], R>(fn: (...params: A) => R): (...params: A) => R | undefined {
    return (...params: A) => {
        if (!ACTUALLY_RUN_WRITE_FUNCTION) {
            console.log("Please set ACTUALLY_RUN_WRITE_FUNCTION to true to run the function");
            return undefined;
        }
        return fn(...params);
    };
}
```

---

An `ERC20` has the following write functions:
```solidity
function approve(address _spender, uint256 _value) public returns (bool success);
function transfer(address _to, uint256 _value) public returns (bool success);
```

As the read-only function, you can also use these functions similarly to calling them in a contract:

```typescript
import { BigNumberish } from '@pendle/sdk-v2';

const writeFunctionExample = guardWrite(async (
    erc20: ERC20,
    spenderAddress: string,
    rawAmount: BigNumberish
) => {
    await erc20.approve(spenderAddress, rawAmount);
    await erc20.transfer(spenderAddress, rawAmount);
});
```

To run the function, we need `spenderAddress`, as well as an `amount`.

```typescript
const spenderAddress = '0x221b0a202d7926fc1b9257310b5a16592f2ab852';
const amount = 0;
```

```typescript
await writeFunctionExample(readWriteErc20, spenderAddress, amount);
```

Outputs:

<pre><code>Please set ACTUALLY_RUN_WRITE_FUNCTION to true to run the function

</code></pre><br>

In `writeFunctionExample`, two transactions will be sent. The first one is a approve transaction. After the first one is done, another transaction, with is transfer is sent.

## Meta-methods

Sometimes we don’t want to make a change to the network, but we only want to see the hypothetical results, or we want to estimate the amount of gas used. Ethers.js allows doing these actions directly via [`callStatic`](https://docs.ethers.io/v5/api/contract/contract/#contract-callStatic) and [`estimateGas`](https://docs.ethers.io/v5/api/contract/contract/#contract-estimateGas) *[meta classes](https://docs.ethers.io/v5/api/contract/contract/#Contract--metaclass)*. Pendle SDK also allows doing these actions via the *meta-method*. Each write function also accepts an additional parameter, which is `MetaMethodType`, defined as follows:

```ts
type MetaMethodType = 'send' | 'callStatic' | 'estimateGas' | 'meta-method' | 'multicallStatic';
```

### `send` meta-method

This meta-method is the default behavior for a method call, which is to perform a transaction

```typescript
import { Overrides } from 'ethers'; 

const writeFunctionExample_sendMetaMethod = guardWrite(async (
    erc20: ERC20,
    spenderAddress: string,
    rawAmount: BigNumberish,
    overrides?: Overrides
) => {
    await erc20.approve(spenderAddress, rawAmount, { method: 'send', overrides });
    await erc20.transfer(spenderAddress, rawAmount, { method: 'send', overrides });
});
```

```typescript
await writeFunctionExample_sendMetaMethod(readWriteErc20, spenderAddress, amount);
```

Outputs:

<pre><code>Please set ACTUALLY_RUN_WRITE_FUNCTION to true to run the function

</code></pre><br>

`writeFunctionExample_sendMetaMethod` does the same thing as `writeFunctionExample`.

### `callStatic` meta-method

Use this meta-method to ask a node to execute the contract and return the hypothetical results of the method.

```typescript
async function writeFunctionExample_callStaticMetaMethod(
    erc20: ERC20,
    spenderAddress: string,
    rawAmount: BigNumberish,
    overrides?: Overrides
) {
    const isApproved = await erc20.approve(spenderAddress, rawAmount, { method: 'callStatic', overrides });
    const transferable = await erc20.transfer(spenderAddress, rawAmount, { method: 'callStatic', overrides });
    return { isApproved, transferable };
}
```

```typescript
await writeFunctionExample_callStaticMetaMethod(readWriteErc20, spenderAddress, amount);
```

Outputs:

<pre><code>{
  isApproved: <span style="color:#A50">true<span style="color:#FFF">,
  transferable: <span style="color:#A50">true<span style="color:#FFF">
}</span></span></span></span>
</code></pre><br>

### `multicallStatic` meta-method

This is the same as `callStatic` but with Multicall. Note that `multicall` effects only happen for this meta-method if the entity is initialized with `Multicall`. If you want to pass a multicall instance to the method call, see [`meta-method` meta-method.](https://www.notion.so/ERC20-contract-interaction-tutorial-with-Pendle-SDK-db0bd481eed541cd88c5f226887d8600)

```typescript
async function writeFunctionExample_multicallStaticMetaMethod(
     erc20: ERC20,
     spenderAddress: string,
     amount: BigNumberish,
     multicall?: Multicall
) {
    const [isApproved, transferable] = await Promise.all([
        erc20.approve(spenderAddress, amount, { method: 'multicallStatic', multicall }),
        erc20.transfer(spenderAddress, amount, { method: 'multicallStatic', multicall })
    ]);
    return { isApproved, transferable };
}
```

```typescript
await writeFunctionExample_multicallStaticMetaMethod(readWriteErc20, spenderAddress, amount, multicall);
```

Outputs:

<pre><code>{
  isApproved: <span style="color:#A50">true<span style="color:#FFF">,
  transferable: <span style="color:#A50">true<span style="color:#FFF">
}</span></span></span></span>
</code></pre><br>

### `estimateGas` meta-method
Use this meta method to estimate the amount of gas consumed for the method calls.

```typescript
async function writeFunctionExample_estimateGasMetaMethod(
    erc20: ERC20,
    spenderAddress: Address,
    amount: BigNumberish,
    overrides?: Overrides
) {
    const approveGasUsed = String(await erc20.approve(spenderAddress, amount, {
        method: 'estimateGas',
        overrides
    }));
    const transferGasUsed = String(await erc20.transfer(spenderAddress, amount, {
        method: 'estimateGas',
        overrides
    }));
    return { approveGasUsed, transferGasUsed };
}
```

```typescript
await writeFunctionExample_estimateGasMetaMethod(readWriteErc20, spenderAddress, amount);
```

Outputs:

<pre><code>{
  approveGasUsed: <span style="color:#0A0">'40160'<span style="color:#FFF">,
  transferGasUsed: <span style="color:#0A0">'43348'<span style="color:#FFF">
}</span></span></span></span>
</code></pre><br>

### `meta-method` meta-method
To have more control over the write method, meta-method can be used.

```typescript
async function writeFunctionExample_metaMethodMetaMethod(
    erc20: ERC20,
    spenderAddress: string,
    amount: BigNumberish,
    multicall?: Multicall,
    overrides?: Overrides
) {
    const metaMethod = await erc20.approve(spenderAddress, amount, { method: 'meta-method' });

    const isApproved = await metaMethod.callStatic(overrides);
    const isApprovedWithMulticall = await metaMethod.multicallStatic({ multicall });
    const gasUsed = String(await metaMethod.estimateGas(overrides));
    
    console.log({
        isApproved,
        isApprovedWithMulticall,
        gasUsed,
    });
        
    // actually perform the transaction
    await guardWrite(
        () => metaMethod.send(overrides)
    )();  
}
```

```typescript
await writeFunctionExample_metaMethodMetaMethod(readWriteErc20, spenderAddress, amount);
```

Outputs:

<pre><code>{ isApproved: true, isApprovedWithMulticall: true, gasUsed: '40160' }
Please set ACTUALLY_RUN_WRITE_FUNCTION to true to run the function

</code></pre><br>

# Other functionalities

## The inner contract

ERC20 entity has a property called `contract: WrappedContract<PendleERC20>`. `PendleERC20` is the contract interface generated to be compatible with ethers.js’s `Contract` object via [`@typechain/hardhat`](https://www.npmjs.com/package/@typechain/hardhat) plugin. `WrappedContract` is our custom type that wraps around the generated interface to have additional functionalities, such as catching Pendle contract errors and calling contracts with multicall and meta-methods. See [`WrappedContract`](https://www.notion.so/Pendle-SDK-s-WrappedContract-18444f7d35d6411b87ce487812be4b58) // TODO fix link.

```typescript
import { WrappedContract, PendleERC20 } from '@pendle/sdk-v2';

const wrappedContract: WrappedContract<PendleERC20> = readWriteErc20.contract;
```


## Setting the ABI

If you wish to extend `ERC20` classes with a different contract ABI, you can set the ABI via the constructor configuration parameters. The ABI should have a compatible type with the `ERC20` ABI. Be careful to do otherwise, as Pendle SDK does not check to ABI compatibility.

```typescript
import { PendlePrincipalTokenABI, ChainId, NetworkConnection } from '@pendle/sdk-v2';

function createErc20ForPT(
    address: Address,
    chainId: ChainId,
    networkConnection: NetworkConnection
) {
    return new ERC20(address, chainId, { ...networkConnection, abi: PendlePrincipalTokenABI });
}
```

The `contract` property, however, will still be `WrappedContract<PendleERC20>`. If you know the correct type, you can cast it to that type.

If you wish to create a subclass of `ERC20`, you can do as follows:

```typescript
import { PendlePrincipalToken } from '@pendle/sdk-v2';

class ERC20ForPT extends ERC20 {
    // ...
    
    get myContract(): WrappedContract<PendlePrincipalToken> {
        return this._contract as WrappedContract<PendlePrincipalToken>;
    }
}
```

This is exactly what is done under the hood of Pendle SDK, as `PendlePrincipalToken` does indeed extend `PendleERC20` on the contract side. See PtEntity (TODO link).
> Note: in our code base we actually use `get contract` instead of `get myContract`. But this notebook kernel is a bit old. The code could not be compiled with `get contract`, so we put `get myContract` instead. 