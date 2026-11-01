import { randomBytes } from 'node:crypto';
import { defineConfig } from '@playwright/test';

// Password admin tes dibuat acak setiap kali tes dijalankan. Tidak ada password tertulis di repo.
process.env.E2E_ADMIN_PASSWORD ??= randomBytes(16).toString('hex');

const PORT = 3300;
const DATA_DIR = './test-data';

export default defineConfig({
	testDir: 'e2e',
	workers: 1,
	fullyParallel: false,
	timeout: 30_000,
	use: { baseURL: `http://localhost:${PORT}`, viewport: { width: 390, height: 844 } },
	webServer: {
		command: `node --experimental-strip-types --no-warnings scripts/e2e-setup.ts && node --experimental-strip-types --no-warnings scripts/seed.ts --contoh && node build/index.js`,
		url: `http://localhost:${PORT}/robots.txt`,
		reuseExistingServer: false,
		env: { E2E_ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD, SEED_BASE: '450', PORT: String(PORT), HOST: '127.0.0.1', DATA_DIR, ORIGIN: `http://localhost:${PORT}`, BODY_SIZE_LIMIT: '15728640' }
	}
});
