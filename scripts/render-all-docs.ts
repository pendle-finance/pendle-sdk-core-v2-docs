import { main } from './render-ts-docs';
const outDir = './rendered-docs';

const files = [
    './docs/sdk-doc-playground.mts', // always render this first.
    './docs/*.mts',
];

if (require.main === module) {
    main(outDir, files)
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
