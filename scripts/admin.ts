/**
 * Kelola akun admin dari terminal server.
 *   npm run admin -- create     buat akun admin (email dan password ditanya)
 *   npm run admin -- reset      ganti password admin
 *   npm run admin -- list       lihat email admin
 * Password tidak pernah ditulis di argumen perintah supaya tidak tersimpan di riwayat terminal.
 */
import { createInterface } from 'node:readline';
import { createAdmin, setAdminPassword } from '../src/lib/server/auth.ts';
import { openDb } from '../src/lib/server/db.ts';

function ask(question: string, hidden = false): Promise<string> {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
		if (hidden) {
			const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
			out._writeToOutput = (s: string) => {
				if (s.includes(question)) out.output.write(s);
				else if (s === '\r\n' || s === '\n') out.output.write(s);
			};
		}
		rl.question(question, (answer) => {
			rl.close();
			if (hidden) process.stdout.write('\n');
			resolve(answer);
		});
	});
}

async function askPassword(): Promise<string> {
	const a = await ask('Password baru (minimal 10 karakter): ', true);
	const b = await ask('Ulangi password: ', true);
	if (a !== b) throw new Error('Password tidak sama');
	return a;
}

async function main() {
	const cmd = process.argv[2];
	const db = openDb();
	const users = db.prepare('SELECT id, email FROM admin_user ORDER BY id').all() as { id: number; email: string }[];
	if (cmd === 'list') {
		if (!users.length) console.log('Belum ada akun admin.');
		for (const u of users) console.log(u.email);
		return;
	}
	if (cmd === 'create') {
		if (users.length) throw new Error('Akun admin sudah ada. Pakai "npm run admin -- reset" untuk ganti password.');
		const email = await ask('Email admin: ');
		await createAdmin(db, email, await askPassword());
		console.log('Akun admin dibuat. Masuk lewat /admin/masuk');
		return;
	}
	if (cmd === 'reset') {
		if (!users.length) throw new Error('Belum ada akun admin. Pakai "npm run admin -- create".');
		await setAdminPassword(db, users[0].id, await askPassword());
		console.log(`Password ${users[0].email} sudah diganti. Semua perangkat yang masuk sebelumnya otomatis keluar.`);
		return;
	}
	console.log('Pakai: npm run admin -- create | reset | list');
}

main().catch((err) => {
	console.error('Gagal:', err instanceof Error ? err.message : err);
	process.exit(1);
});
