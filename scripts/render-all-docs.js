const { nnbToMd } = require('./nnb-to-md');
const fs = require('fs');
const path = require('path');

// https://gist.github.com/lovasoa/8691344
async function* walk(dir) {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}

// https://stackoverflow.com/questions/13542667/create-directory-when-writing-to-file-in-node-js
async function isExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};

async function writeFile(filePath, data) {
    const dirname = path.dirname(filePath);
    const exist = await isExists(dirname);
    if (!exist) {
        await fs.promises.mkdir(dirname, { recursive: true });
    }

    await fs.promises.writeFile(filePath, data, 'utf8');

}

const docsDir = './docs/';
const renderedDocsDir = './rendered-docs/';

async function processFile(fileName) {
    const data = await fs.promises.readFile(fileName, {encoding: 'utf-8'});
    const result = nnbToMd(JSON.parse(data));
    const dir = path.dirname(fileName);
    const baseName = path.basename(fileName, '.nnb');
    const outputFileName = path.join(renderedDocsDir, dir, baseName + '.md');
    await writeFile(outputFileName, result);
}

async function main() {
    const promises = [];
    for await (const fileName of walk(docsDir)) {
        if (path.extname(fileName) !== '.nnb') {
            continue;
        }
        promises.push(processFile(fileName));
    }
    await Promise.all(promises);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });