var Convert = require('ansi-to-html');
var ansiToHtmlConvert = new Convert();

function markdownCodeBlock(language, source) {
    const threeTicks = '```';
    return `${threeTicks}${language}
${source}
${threeTicks}`
}

module.exports.nnbToMd = function nnbToMd(nnbJson) {
    const results = [];
    for (const cell of nnbJson.cells) {
        if (cell.language === 'markdown') {
            results.push(cell.source);
        } else {
            results.push(markdownCodeBlock(cell.language, cell.source));
            if (cell.outputs.length) {
                results.push('Outputs:');
            }
            for (const output of cell.outputs) {
                for (const item of output.items ?? []) {
                    console.log(item);
                    // TODO suport more output types
                    if (Array.isArray(item.value)) {
                        results.push(`<pre><code>${ansiToHtmlConvert.toHtml(item.value.join('\n'))}
</code></pre><br>`);
                    }
                }

            }
        }
    }
    return results.join('\n\n');
}