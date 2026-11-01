/** Menyiapkan database kosong untuk tes e2e: akun admin tes dan data contoh. Hanya untuk tes. */
import { rmSync } from 'node:fs';
import { createAdmin } from '../src/lib/server/auth.ts';
import { openDb } from '../src/lib/server/db.ts';

const dir = process.env.DATA_DIR;
if (!dir || !dir.includes('test')) throw new Error('DATA_DIR untuk tes harus berisi kata "test"');
rmSync(dir, { recursive: true, force: true });
const db = openDb();
await createAdmin(db, 'tes@bynana.my.id', 'password-tes-panjang');
db.close();
console.log('database tes siap');
