import fs from 'fs';
import { exec } from 'child_process';
import { Buffer } from 'buffer';

const tempDir = './temp-dir';
const mkTempDirPromise = fs.promises.mkdir(tempDir, { recursive: true });
let currentFileId = 0;

async function writeTempFile(content: string, extension = '.ts'): Promise<string> {
    await mkTempDirPromise;
    let fileId = currentFileId++;
    const fileName = `${tempDir}/${fileId}${extension}`;
    await fs.promises.writeFile(fileName, content);
    return fileName;
}

function decodeBuffer(buff: Buffer | string): string {
    if (Buffer.isBuffer(buff)) {
        return buff.toString('utf8');
    }
    return buff;
}

export async function execTypescript(typescriptCode: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        const tsFile = await writeTempFile(typescriptCode);
        exec(`yarn ts-node ${tsFile}`, {}, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            if (stderr) {
                console.error(decodeBuffer(stderr));
            }
            resolve(decodeBuffer(stdout));
        });
    });
}
