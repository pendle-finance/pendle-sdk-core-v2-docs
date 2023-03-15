import { Buffer } from 'buffer';

export function decodeBuffer(buff: Buffer | string): string {
    if (Buffer.isBuffer(buff)) {
        return buff.toString('utf8');
    }
    return buff;
}

