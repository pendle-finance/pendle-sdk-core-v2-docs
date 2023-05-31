import * as playground from '../playground.mjs';
declare global {
    const provider: typeof playground.provider;
    const testAccounts: typeof playground.testAccounts;
}