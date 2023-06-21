import { execTypescript } from './exec-typescript';
import { zip } from '@pendle/sdk-v2';
import { providers } from 'ethers';
import { glob } from 'glob';
import { evm_revert, evm_snapshot } from './util';
import fs from 'fs';
import path from 'path';
import { resolveIncludePath, replaceAsync } from './utils';
import z from 'zod';

export const DIRECTIVE_COMMAND_SCHEMA = z.object({
    include: z.string().optional(),
});

export async function preprocessTs(filePath: string): Promise<string> {
    const content = await fs.promises.readFile(filePath, { encoding: 'utf-8' });

    const directivePattern = /^\/\/\/(.*)$/gm;

    const processDirective = async (_match: string, directiveContent: string) => {
        if (!directiveContent.startsWith('/')) return '';
        directiveContent = directiveContent.substring(1);
        const parsedDirective = DIRECTIVE_COMMAND_SCHEMA.parse(JSON.parse(directiveContent));
        if (parsedDirective.include) {
            const includedFilePath = resolveIncludePath(filePath, parsedDirective.include);
            const processedIncludedFile = await preprocessTs(includedFilePath).then((content) =>
                replaceImportPath(filePath, includedFilePath, content)
            );

            return processedIncludedFile;
        }
        return '';
    };

    return replaceAsync(content, directivePattern, processDirective);
}

export function replaceImportPath(
    filePath: string,
    importedFilePath: string,
    importedFileContent: string
): string {
    const importPattern = /import (.*?) from ['"](.*?)['"]/g;
    const dir = path.dirname(filePath);
    return importedFileContent.replace(
        importPattern,
        (_match, importGroup: string, importedFileGroup: string): string => {
            let replacedFilePath = resolveIncludePath(importedFilePath, importedFileGroup);
            if ('./'.includes(replacedFilePath[0])) {
                replacedFilePath = './' + path.relative(dir, replacedFilePath);
            }
            return `import ${importGroup} from '${replacedFilePath}'`;
        }
    );
}

export const docTagRegex = /\/\*\s===(.*?)===\s*\*\//gs;
export const outputSpearatorTag = '=====\n=====';
export const outputSeparatorTagRegex = new RegExp(`(${outputSpearatorTag})`, 'gs');
export const hideOutputTag = /\/\/\s*?@hideOutput\s*?$/gm;

const headerCode = `
// From https://2ality.com/2022/07/nodejs-esm-main.html
import * as url from 'node:url';

let console = global.console;
if (import.meta.url.startsWith('file:')) { // (A)
    const modulePath = url.fileURLToPath(import.meta.url);
    const isMainModule = process.argv[1] === modulePath;
    if (!isMainModule) {
        const doNothingConsole = new Proxy(console, { get: () => () => {} });
        console = doNothingConsole;
    }
}

function __printSeparator() {
    console.log(${JSON.stringify(outputSpearatorTag)});
}
`;

const footerCode = ``;

export async function renderTsDocs(content: string, fileName: string) {
    const parsedContent = content.split(docTagRegex);
    const parsedOutput = await (async () => {
        if (process.env['NO_EVAL'] === '1') {
            return Array.from({ length: parsedContent.length }, () => '');
        }
        const typescriptCode =
            headerCode +
            parsedContent
                .map((block, index) => {
                    if (index % 2 === 0) {
                        return block;
                    }
                    return `__printSeparator();`;
                })
                .join('\n') +
            footerCode;

        const output = await execTypescript(typescriptCode, fileName.replace(/\.ts$/, '.mts'));
        return output.split(outputSeparatorTagRegex);
    })();

    const processMarkdownContent = (content: string) => {
        return content.replace(/\[(.*?)\]\((.*?\.mts)\)/g, '[$1]($2.md)');
    };

    const processTypeScriptContent = (content: string) => {
        const processedContent = content.replace(hideOutputTag, '');
        let hideOutput = processedContent.length !== content.length;
        return { processedContent, hideOutput };
    };

    const result = Array.from(zip(parsedContent, parsedOutput), ([content, output], index) => {
        content = content.trim();
        if (index % 2 === 1) {
            return processMarkdownContent(content);
        }

        if (content.length === 0) {
            return '';
        }
        const { processedContent, hideOutput } = processTypeScriptContent(content);
        let curResult = '\n```ts\n' + processedContent + '\n```\n';
        if (output.trim() !== '' && !hideOutput) {
            curResult += '\nOutput:\n\n```' + output.trimEnd() + '\n```\n';
        }
        return curResult;
    }).join('\n');
    return result;
}

export async function main(outDir: string, fileArgs: string[]) {
    const frontMatter = await fs.promises
        .readFile('./shared-front-matter.md', { encoding: 'utf-8' })
        .catch(() => '');

    const postProcessMd = (content: string): string => {
        return `${frontMatter}\n${content}`;
    };

    const processSingleFile = async (inFileName: string) => {
        const preprocssedFileContent = await preprocessTs(path.resolve(inFileName));
        const generatedContent = await renderTsDocs(preprocssedFileContent, inFileName).then(
            postProcessMd
        );
        const outFileName = path.join(outDir, inFileName) + '.md';
        await fs.promises.mkdir(path.dirname(outFileName), { recursive: true });
        await fs.promises.writeFile(outFileName, generatedContent);
    };

    const files = (await Promise.all(fileArgs.map((fileArg) => glob(fileArg)))).flat();

    const localForkProvider = new providers.StaticJsonRpcProvider();
    const snapshot = await evm_snapshot(localForkProvider);

    let processedFileCount = 0;

    for (const file of files) {
        console.log(`Processing ${file}`);
        try {
            await processSingleFile(file);
            ++processedFileCount;
        } finally {
            await evm_revert(localForkProvider, snapshot);
        }
    }
    console.log(`[Done]: ${processedFileCount}/${files.length} files processed`);
}

async function execMain() {
    function printUsage() {
        console.info(`Usage:
    yarn ts-node scripts/render-ts-docs <outDir> <file1> [<file2> ...]
`);
    }
    const outDir = process.argv[2];
    const fileArgs = process.argv.slice(3);
    if (outDir == undefined || fileArgs.length === 0) {
        printUsage();
        return;
    }
    return main(outDir, fileArgs);
}

if (require.main === module) {
    execMain()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
