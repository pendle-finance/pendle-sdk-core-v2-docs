/* ===
Pendle SDK is built on top of [Ethers.js](https://docs.ethers.org/v5/) library.
To interact with the contract with Ethers.js, first we need to prepare two
things:

- A `provider`, which is a connection to the Ethereum network.
- A `signer`, which holds your private key and can sign things.

Typically, `provider` and `signer` that interact with the Ethereum network via
JSON-RPC can be created  as follows:

```ts
import ethers from 'ethers';

const jsonRpcUrl = 'your-json-rpc-url';
const privateKey = 'your-private-key';
const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
const signer = new ethers.Wallet(privateKey, provider);
```

Please checkout the [documentation](https://docs.ethers.org/v5/getting-started) of
Ethers.js for the usage of `provider` and `signer`.

To demonstrate the usage of Pendle SDK, we will use a prepared `provider` and
some test accounts with filled balances in a local forked network. (Checkout
[playground.mts](../sdk-doc-playground.mts) to see how they are created).
=== */

import ethers from 'ethers';
import { provider, testAccounts } from '../sdk-doc-playground.mjs';

{
    const address = testAccounts[0].address;
    const ethBalance = ethers.utils.formatEther(await testAccounts[0].wallet.getBalance());
    console.log('Test account info:', { address, ethBalance });
}
