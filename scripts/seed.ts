/**
 * Data contoh untuk mencoba tampilan situs dan admin.
 *
 *   npm run seed -- --contoh         isi data contoh (produk, kategori, kartu, akun sosmed, klik)
 *   npm run seed -- --hapus-contoh   hapus semua data contoh, data asli tidak disentuh
 *
 * Nomor produk contoh dimulai dari 9001 supaya tidak bentrok dengan nomor asli dari video.
 * Semua yang dibuat dicatat, jadi bisa dihapus bersih tanpa menyentuh data asli.
 */
import sharp from 'sharp';
import { createCard, deleteAccount, deleteCard, saveAccount } from '../src/lib/server/cards.ts';
import { createCategory, deleteCategory, listCategories } from '../src/lib/server/categories.ts';
import { todayWib } from '../src/lib/server/clicks.ts';
import { openDb, type DB } from '../src/lib/server/db.ts';
import { removeImage, saveImage } from '../src/lib/server/images.ts';
import { createProduct, deleteProduct, getProduct, setStatus, type ProductStatus } from '../src/lib/server/products.ts';
import type { Store } from '../src/lib/server/stores.ts';

const MARKER = 'contoh_data';
const BASE = Number(process.env.SEED_BASE || 9001);

interface Seeded {
	products: number[];
	cards: number[];
	accounts: number[];
	categories: number[];
	images: string[];
}

type Row = [name: string, price: number | null, category: string, stores: Store[], status?: ProductStatus];

/** Dua belas produk pertama dipakai juga oleh tes e2e. Jangan ubah urutannya. */
const FIRST: Row[] = [
	['Serum Niacinamide 10% 30 ml', 49900, 'Skincare', ['shopee', 'tiktok']],
	['Rak Sepatu Susun 5', 87000, 'Rumah', ['shopee']],
	['Kemeja Linen Oversize', 129000, 'Fashion', ['tiktok']],
	['Botol Minum 1 Liter', 35500, 'Rumah', ['shopee', 'tokopedia']],
	['Sunscreen Gel SPF 50', 59000, 'Skincare', ['shopee', 'tiktok']],
	['Wajan Anti Lengket 24 cm', 142000, 'Dapur', ['shopee']],
	['Cushion Matte Natural', 89000, 'Skincare', ['tiktok']],
	['Kotak Penyimpanan Lipat', 45000, 'Rumah', ['lazada']],
	['Rok Plisket Panjang', 99000, 'Fashion', ['shopee']],
	['Talenan Kayu Jati', 65000, 'Dapur', ['tokopedia']],
	['Lip Tint Tahan Lama', 39000, 'Skincare', ['shopee', 'tiktok']],
	['Lampu Tidur Sentuh', 72000, 'Rumah', ['shopee']]
];

const MORE: Row[] = [
	['Toner Eksfoliasi AHA BHA 100 ml', 68000, 'Skincare', ['shopee', 'tiktok', 'tokopedia']],
	['Masker Tidur Rice Water', 54000, 'Skincare', ['tiktok']],
	['Pelembap Gel Centella 50 ml', 47500, 'Skincare', ['shopee']],
	['Micellar Water 400 ml', 39900, 'Skincare', ['shopee', 'lazada']],
	['Hijab Voal Motif Bunga', 45000, 'Fashion', ['shopee', 'tiktok']],
	['Celana Kulot Highwaist', 89000, 'Fashion', ['tiktok']],
	['Tas Selempang Kanvas', 115000, 'Fashion', ['shopee']],
	['Sandal Jepit Empuk', 32000, 'Fashion', ['shopee', 'tokopedia']],
	['Gantungan Baju Lipat isi 10', 25000, 'Rumah', ['shopee']],
	['Keranjang Laundry Lipat', 58000, 'Rumah', ['tiktok', 'lazada']],
	['Tirai Blackout 150 x 200 cm', 135000, 'Rumah', ['shopee']],
	['Pengharum Ruangan Otomatis', 79000, 'Rumah', ['tiktok']],
	['Spatula Silikon Set 5', 42000, 'Dapur', ['shopee', 'tiktok']],
	['Wadah Kedap Udara isi 6', 99000, 'Dapur', ['tokopedia']],
	['Teflon Mini 16 cm', 55000, 'Dapur', ['shopee']],
	['Blender Portable USB', 129000, 'Dapur', ['shopee', 'tiktok', 'lazada']],
	['Parfum Body Mist Vanilla', null, 'Skincare', ['tiktok'], 'draft'],
	['Jaket Parasut Ringan', 159000, 'Fashion', ['shopee'], 'archived']
];

const TINTS: Record<string, [string, string]> = {
	Skincare: ['#ffd3e6', '#c0306b'],
	Rumah: ['#eef9c4', '#4d6b00'],
	Fashion: ['#e6e0ff', '#4b3aa6'],
	Dapur: ['#ffe4c7', '#9a4b00']
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Gambar produk contoh: jelas tertulis "Foto contoh" supaya tidak dikira foto asli. */
async function placeholder(name: string, category: string): Promise<string> {
	const [bg, ink] = TINTS[category] ?? ['#f1f1f1', '#141414'];
	const words = name.split(' ');
	const lines: string[] = [];
	let line = '';
	for (const w of words) {
		if ((line + ' ' + w).trim().length > 16 && line) {
			lines.push(line);
			line = w;
		} else line = (line + ' ' + w).trim();
	}
	if (line) lines.push(line);
	const text = lines
		.slice(0, 3)
		.map((l, i) => `<text x="64" y="${430 + i * 74}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="60" fill="${ink}">${esc(l)}</text>`)
		.join('');
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
<rect width="800" height="800" fill="${bg}"/>
<rect x="64" y="64" width="250" height="64" rx="32" fill="${ink}"/>
<text x="92" y="108" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="30" fill="${bg}">Foto contoh</text>
<text x="64" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="${ink}">${esc(category)}</text>
${text}
</svg>`;
	return saveImage(await sharp(Buffer.from(svg)).png().toBuffer());
}

function linkFor(store: Store, n: number, j: number): string {
	if (store === 'shopee') return `https://s.shopee.co.id/contoh${n}${j}`;
	if (store === 'tiktok') return `https://vt.tokopedia.com/t/contoh${n}${j}/`;
	if (store === 'tokopedia') return `https://tokopedia.link/contoh${n}${j}`;
	return `https://s.lazada.co.id/s.contoh${n}${j}`;
}

function readMarker(db: DB): Seeded | null {
	const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(MARKER) as { value: string } | undefined;
	return row ? (JSON.parse(row.value) as Seeded) : null;
}

/** Klik palsu untuk 14 hari terakhir, supaya halaman Klik di admin bisa dicoba. */
function fakeClicks(db: DB, seeded: Seeded) {
	const insert = db.prepare(
		`INSERT INTO click_daily (target_type, target_id, day, count) VALUES (?, ?, ?, ?)
     ON CONFLICT(target_type, target_id, day) DO UPDATE SET count = count + excluded.count`
	);
	let seed = 7;
	const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
	const linkIds = seeded.products.flatMap((id) => getProduct(db, id)?.links.map((l) => l.id) ?? []);
	for (let d = 0; d < 14; d++) {
		const day = todayWib(new Date(Date.now() - d * 86400 * 1000));
		for (const id of linkIds) if (rand() > 0.45) insert.run('link', id, day, 1 + Math.floor(rand() * 9));
		for (const id of seeded.cards) if (rand() > 0.5) insert.run('card', id, day, 1 + Math.floor(rand() * 5));
		for (const id of seeded.accounts) if (rand() > 0.5) insert.run('account', id, day, 1 + Math.floor(rand() * 4));
	}
}

async function fill(db: DB) {
	if (readMarker(db)) throw new Error('Data contoh sudah ada. Hapus dulu dengan: npm run seed -- --hapus-contoh');
	const taken = db.prepare('SELECT number FROM products WHERE number >= ? AND number < ?').get(BASE, BASE + 200);
	if (taken) throw new Error(`Nomor ${BASE} sampai ${BASE + 199} sudah dipakai produk lain.`);

	const seeded: Seeded = { products: [], cards: [], accounts: [], categories: [], images: [] };

	const cats = new Map<string, number>();
	for (const name of ['Skincare', 'Rumah', 'Fashion', 'Dapur']) {
		const existing = listCategories(db).find((c) => c.name.toLowerCase() === name.toLowerCase());
		if (existing) cats.set(name, existing.id);
		else {
			const c = createCategory(db, name);
			cats.set(name, c.id);
			seeded.categories.push(c.id);
		}
	}

	const before = new Set((db.prepare('SELECT id FROM social_accounts').all() as { id: number }[]).map((r) => r.id));
	saveAccount(db, { platform: 'tiktok', label: '@bynana', url: 'https://www.tiktok.com/@bynana' });
	saveAccount(db, { platform: 'tiktok', label: '@bynana.rumah', url: 'https://www.tiktok.com/@bynana.rumah' });
	saveAccount(db, { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/bynana' });
	saveAccount(db, { platform: 'shopee', label: 'Shopee', url: 'https://shopee.co.id/bynana' });
	saveAccount(db, { platform: 'threads', label: 'Threads', url: 'https://www.threads.net/@bynana' });
	saveAccount(db, { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/bynana' });
	seeded.accounts = (db.prepare('SELECT id FROM social_accounts').all() as { id: number }[]).map((r) => r.id).filter((id) => !before.has(id));

	const today = todayWib();
	const inDays = (n: number) => todayWib(new Date(Date.now() + n * 86400 * 1000));
	seeded.cards.push(
		createCard(db, {
			kind: 'promo',
			title: 'Kumpulan diskon 11.11',
			body: 'Produk yang lagi turun harga, aku kumpulkan di satu tempat.',
			buttonLabel: 'Lihat produk Rumah',
			categoryId: cats.get('Rumah')
		}).id,
		createCard(db, { kind: 'video', title: 'Video terbaru: rapikan rak sepatu', body: 'Semua barangnya ada di daftar di bawah.', url: 'https://www.tiktok.com/@bynana' }).id,
		createCard(db, { kind: 'link', title: 'Etalase Shopee aku', body: 'Semua produk yang pernah aku bahas, dalam satu etalase.', buttonLabel: 'Buka etalase', url: 'https://shopee.co.id/bynana' }).id,
		createCard(db, { kind: 'teks', title: 'Nomor ada di caption', body: 'Lupa nomornya? Cek caption video, lalu ketik di kolom cari.' }).id,
		createCard(db, { kind: 'promo', title: 'Promo gajian', body: 'Contoh kartu yang baru tampil beberapa hari lagi.', categoryId: cats.get('Skincare'), startsAt: inDays(5), endsAt: inDays(8) }).id,
		createCard(db, { kind: 'teks', title: 'Kartu tersembunyi', body: 'Contoh kartu yang disembunyikan dari situs.', visible: false, startsAt: today }).id
	);

	const all: [number, Row][] = [
		...FIRST.map((r, i): [number, Row] => [BASE + [0, 3, 4, 5, 8, 9, 10, 13, 14, 15, 18, 19][i], r]),
		...MORE.map((r, i): [number, Row] => [BASE + 60 + i, r])
	];
	for (const [number, [name, price, cat, stores, status]] of all) {
		const image = await placeholder(name, cat);
		seeded.images.push(image);
		const p = createProduct(db, {
			number,
			name,
			price,
			image,
			categoryId: cats.get(cat),
			status: 'published',
			links: stores.map((s, j) => ({ store: s, url: linkFor(s, number, j) }))
		});
		if (status && status !== 'published') setStatus(db, p.id, status);
		seeded.products.push(p.id);
	}
	const draft = createProduct(db, { number: BASE + 99, name: '', status: 'draft', links: [{ url: `https://s.shopee.co.id/drafcontoh${BASE}` }] });
	seeded.products.push(draft.id);

	fakeClicks(db, seeded);
	db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(MARKER, JSON.stringify(seeded));
	console.log(
		`Data contoh terisi: ${seeded.products.length} produk (nomor ${BASE} ke atas, termasuk 2 draf dan 1 arsip), ` +
			`${seeded.cards.length} kartu, ${seeded.accounts.length} akun sosmed, ${seeded.categories.length} kategori baru, dan klik 14 hari.`
	);
	console.log('Hapus lagi dengan: npm run seed -- --hapus-contoh');
}

function clear(db: DB) {
	const seeded = readMarker(db);
	if (!seeded) {
		console.log('Tidak ada data contoh yang tercatat.');
		return;
	}
	db.transaction(() => {
		const linkIds = seeded.products.flatMap((id) => getProduct(db, id)?.links.map((l) => l.id) ?? []);
		const delClicks = db.prepare('DELETE FROM click_daily WHERE target_type = ? AND target_id = ?');
		for (const id of linkIds) delClicks.run('link', id);
		for (const id of seeded.cards) delClicks.run('card', id);
		for (const id of seeded.accounts) delClicks.run('account', id);
		for (const id of seeded.products) deleteProduct(db, id);
		for (const id of seeded.cards) deleteCard(db, id);
		for (const id of seeded.accounts) deleteAccount(db, id);
		for (const id of seeded.categories) deleteCategory(db, id);
		// Nomor contoh tidak perlu dicadangkan, jadi nomor otomatis kembali melanjutkan nomor asli terbesar.
		db.prepare('UPDATE number_counter SET max_number = (SELECT COALESCE(MAX(number), 0) FROM products) WHERE id = 1').run();
		db.prepare('DELETE FROM settings WHERE key = ?').run(MARKER);
	})();
	for (const img of seeded.images) removeImage(img);
	console.log('Data contoh dihapus. Data asli tidak berubah.');
}

async function main() {
	const db = openDb();
	if (process.argv.includes('--hapus-contoh')) return clear(db);
	if (process.argv.includes('--contoh')) return fill(db);
	console.log('Pakai: npm run seed -- --contoh  atau  npm run seed -- --hapus-contoh');
}

main().catch((err) => {
	console.error('Gagal:', err instanceof Error ? err.message : err);
	process.exit(1);
});
