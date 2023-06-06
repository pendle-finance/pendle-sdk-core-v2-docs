/* ===
Pendle SDK Router is an object that interacts with [Pendle Router
contract](https://etherscan.io/address/0x0000000001e4ef00d069e71d6ba041b0a16f7ea0).
It can be created as follows:
=== */

/// <reference path="./prepare-provider-and-signer.d.ts" />

import { Router } from '@pendle/sdk-v2';

const router = Router.getRouter({
    chainId: 1, // ethereum chain id
    provider,
    signer: testAccounts[0].wallet,
});

console.log('Router address:', router.address);
