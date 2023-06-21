import * as playground from '../sdk-doc-playground.mjs';
declare global {
    const provider: typeof playground.provider;
    const testAccounts: typeof playground.testAccounts;
}