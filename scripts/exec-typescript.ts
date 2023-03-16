import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { decodeBuffer } from './util';

const tempDir = './temp-dir';
const mkTempDirPromise = fs.promises.mkdir(tempDir, { recursive: true });
let currentFileId = 0;

async function writeTempFile(content: string, fileName = `${String(currentFileId++)}.mts`): Promise<string> {
    await mkTempDirPromise;
    const fullFilename = `${tempDir}/${fileName}`;
    await fs.promises.mkdir(path.dirname(fullFilename), { recursive: true });
    await fs.promises.writeFile(fullFilename, content);
    return fullFilename;
}
export async function execTypescript(typescriptCode: string, fileName?: string): Promise<string> {
    const tsFile = await writeTempFile(typescriptCode, fileName);
    return new Promise<string>((resolve, reject) => {
        exec(
            `yarn ts-node --emit --esm -P ./docs/tsconfig.json ${tsFile}`,
            {},
            (error, stdout, stderr) => {
                if (error) {
                    console.log('=== Error during executing documentation');
                    console.log('=== stdout ===');
                    console.log(decodeBuffer(stdout));
                    console.log('=== stderr ===');
                    console.log(decodeBuffer(stderr));
                    reject(error);
                }
                if (stderr) {
                    console.error(decodeBuffer(stderr));
                }
                resolve(decodeBuffer(stdout));
            }
        );
    });
}
