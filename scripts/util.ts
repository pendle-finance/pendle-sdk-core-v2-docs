import { Buffer } from 'buffer';
import { providers } from 'ethers';

export function decodeBuffer(buff: Buffer | string): string {
    if (Buffer.isBuffer(buff)) {
        return buff.toString('utf8');
    }
    return buff;
}

export async function evm_snapshot(provider: providers.StaticJsonRpcProvider): Promise<string> {
    return provider.send('evm_snapshot', []);
}

export async function evm_revert(provider: providers. StaticJsonRpcProvider, snapshotId: string): Promise<void> {
    return provider.send('evm_revert', [snapshotId]);
}

