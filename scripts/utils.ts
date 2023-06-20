import path from 'path';

// https://stackoverflow.com/a/48032528
export async function replaceAsync(
    str: string,
    regex: string | RegExp,
    asyncFn: (match: string, ...rest: any[]) => Promise<string>
) {
    const promises: Promise<string>[] = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
        return '';
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift()!);
}

export function resolveIncludePath(mainFilePath: string, includedFilePath: string) {
    if (!includedFilePath.startsWith('.')) {
        // return path.resolve('./' + includedFilePath);
        return includedFilePath;
    }
    const mainFileRelativeDir = path.dirname(mainFilePath);
    return path.resolve(mainFileRelativeDir, includedFilePath);
}