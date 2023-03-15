import { execTypescript } from './exec-typescript';
import { zip } from '@pendle/sdk-v2';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

export const docTagRegex = /\/\*\s===(.*?)===\s*\*\//gs;
export const outputSpearatorTag = '=====\n====='
export const outputSeparatorTagRegex = new RegExp(`(${outputSpearatorTag})`, 'gs');

export async function renderTsDocs(content: string) {
    const parsedContent = content.split(docTagRegex);
    
    const typescriptCode = parsedContent.map((block, index) => {
        if (index % 2 === 0) {
            return block;
        }
        return `console.log(${JSON.stringify(outputSpearatorTag)});`;
    }).join('\n');
    
    const output = await execTypescript(typescriptCode);
    const parsedOutput = output.split(outputSeparatorTagRegex);
    
    const result = Array.from(zip(parsedContent, parsedOutput), ([content, output], index) => {
        content = content.trim();
        if (index % 2 === 1) {
            return content;
        }
        
        if (content.length === 0) {
            return '';
        }
        let curResult = '```ts\n' + content + '\n```';
        if (output.trim() !== '') {
            curResult += '\nOutput:\n```' + output + '\n```';
        }
        return curResult;
    }).join('\n');
    return result;
}

async function main() {
    function printUsage() {
        console.info(`Usage:
    yarn ts-node scripts/render-ts-docs <outDir> <file1> [<file2> ...]
`);
    }
    const outDir = process.argv[2];
    const fileArgs = process.argv.slice(3);
    if (outDir == undefined || fileArgs.length === 0) {
        printUsage();
        return ;
    }
    
    const processSingleFile = async (inFileName: string) => {
        const fileContent = await fs.promises.readFile(inFileName, { encoding: 'utf8' });
        const generatedContent = await renderTsDocs(fileContent);
        const outFileName = path.join(outDir, inFileName) + '.md';
        await fs.promises.writeFile(outFileName, generatedContent);
    };
    
    const files = (await Promise.all(fileArgs.map((fileArg) => glob(fileArg)))).flat();
    await Promise.all(files.map(processSingleFile));
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
