import { execTypescript } from './exec-typescript';
import { zip } from '@pendle/sdk-v2';
export const docTagRegex = /\/\*\s*@beginDoc(.*)@endDoc\s*\*\//gs;
export const outputSpearatorTag = '=====\n====='

export async function renderTsDocs(content: string) {
    const parsedContent = content.split(docTagRegex);
    
    const typescriptCode = parsedContent.map((block, index) => {
        if (index % 2 === 0) {
            return block;
        }
        return outputSpearatorTag;
    }).join('\n');
    
    const output = await execTypescript(typescriptCode);
    
    const parsedOutput = output.split(outputSpearatorTag);
    
    const result = Array.from(zip(parsedContent, parsedOutput), ([content, output], index) => {
        if (index % 2 === 1) {
            return content;
        }
        
        let curResult = '```ts\n' + content + '\n```';
        if (output.trim() !== '') {
            curResult += '\nOutput:\n```' + output + '\n```';
        }
        return curResult;
    }).join('\n');
    return result;
}
