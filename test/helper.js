import assert from 'node:assert';
import path from 'node:path';
import { build as buildApplication } from 'fastify-cli/helper.js';
import { options as serverOptions } from '../src/app.js';
const AppPath = path.join(import.meta.dirname, '../src/app.ts');
export function config() {
    return {
        skipOverride: true
    };
}
export function expectValidationError(res, expectedMessage) {
    assert.strictEqual(res.statusCode, 400);
    const { message } = JSON.parse(res.payload);
    assert.strictEqual(message, expectedMessage);
}
export async function build(t) {
    const argv = [AppPath];
    const app = (await buildApplication(argv, config(), serverOptions));
    if (t) {
        t.after(() => app.close());
    }
    return app;
}
//# sourceMappingURL=helper.js.map