// Build step: copy the SQL migrations next to the compiled runner (dist/db/migrations) so the image can
// run `node dist/db/migrate-cli.js` as a separate deploy step (erd 16 point 5).
import { cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const api = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(api, 'dist', 'db', 'migrations');
rmSync(target, { recursive: true, force: true });
cpSync(join(api, 'src', 'db', 'migrations'), target, { recursive: true });
console.log('copied migrations to dist/db/migrations');
