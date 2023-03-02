import { utils, Wallet, providers } from 'ethers';
import { toAddress } from '@pendle/sdk-v2';

export const provider = new providers.StaticJsonRpcProvider();

/**
 * Mnemonic defaultly used by hardhat to generate accounts with 1000ETH
 * 
 * @see [hardhat reference](https://hardhat.org/hardhat-network/docs/reference)
 */
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
