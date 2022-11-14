var Convert = require('ansi-to-html');
var ansiToHtmlConvert = new Convert();

function tsBlockComment(text) {
    return `/*
${text}
*/`
}

module.exports.nnbToTs = function nnbToMd(nnbJson) {
    const results = [];
    for (const cell of nnbJson.cells) {
        if (cell.language === 'markdown') {
            results.push(tsBlockComment(cell.source));
        } else {
            results.push(cell.source);
            if (!cell.outputs.length) continue;
            results.push('// Outputs:');
            for (const output of cell.outputs) {
                for (const item of output.items ?? []) {
                    // console.log(item);
                    // TODO suport more output types
                    if (Array.isArray(item.value)) {
                        results.push(tsBlockComment(item.value.join('\n')));
                    }
                }

            }
        }
    }
    return results.join('\n\n');
}