/**
 * Mengisi data contoh untuk mencoba situs di komputer sendiri.
 * Hanya jalan kalau database masih kosong, dan wajib memakai --contoh supaya tidak terjalankan di server tanpa sengaja.
 *   DATA_DIR=./data npm run seed -- --contoh
 */
import sharp from 'sharp';
import { createCard, saveAccount } from '../src/lib/server/cards.ts';
import { createCategory } from '../src/lib/server/categories.ts';
import { openDb } from '../src/lib/server/db.ts';
import { saveImage } from '../src/lib/server/images.ts';
import { createProduct } from '../src/lib/server/products.ts';

const SAMPLE = [
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
] as const;

const COLORS = ['#f6c7d8', '#d9ecc2', '#f3dcc4', '#cfe3f0', '#e8d8f0', '#f0e2b6'];

async function main() {
	if (!process.argv.includes('--contoh')) throw new Error('Tambahkan --contoh untuk mengisi data contoh.');
	const db = openDb();
	const count = (db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }).n;
	if (count > 0) throw new Error('Database sudah berisi produk. Data contoh tidak diisi.');

	const cats = new Map<string, number>();
	for (const name of ['Skincare', 'Rumah', 'Fashion', 'Dapur']) cats.set(name, createCategory(db, name).id);

	saveAccount(db, { platform: 'tiktok', label: '@bynana', url: 'https://www.tiktok.com/@bynana' });
	saveAccount(db, { platform: 'tiktok', label: '@bynana.rumah', url: 'https://www.tiktok.com/@bynana.rumah' });
	saveAccount(db, { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/bynana' });
	saveAccount(db, { platform: 'shopee', label: 'Shopee', url: 'https://shopee.co.id/bynana' });
	saveAccount(db, { platform: 'threads', label: 'Threads', url: 'https://www.threads.net/@bynana' });
	saveAccount(db, { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/bynana' });

	createCard(db, { kind: 'promo', title: 'Kumpulan diskon 11.11', body: 'Produk yang lagi turun harga, aku kumpulkan di satu tempat.', buttonLabel: 'Lihat produk Rumah', categoryId: cats.get('Rumah') });
	createCard(db, { kind: 'video', title: 'Video terbaru: rapikan rak sepatu', body: 'Semua barangnya ada di daftar di bawah.', url: 'https://www.tiktok.com/@bynana' });

	let number = 450;
	for (const [i, [name, price, cat, stores]] of SAMPLE.entries()) {
		const png = await sharp({ create: { width: 800, height: 800, channels: 3, background: COLORS[i % COLORS.length] } }).png().toBuffer();
		const image = await saveImage(png);
		const links = stores.map((s, j) => ({
			store: s,
			url:
				s === 'shopee'
					? `https://s.shopee.co.id/contoh${number}${j}`
					: s === 'tiktok'
						? `https://vt.tokopedia.com/t/contoh${number}${j}/`
						: s === 'tokopedia'
							? `https://tokopedia.link/contoh${number}${j}`
							: `https://s.lazada.co.id/s.contoh${number}${j}`
		}));
		createProduct(db, { number, name, price, image, categoryId: cats.get(cat), status: 'published', links });
		number += 1 + (i % 3 === 0 ? 2 : 0);
	}
	createProduct(db, { name: '', status: 'draft', links: [{ url: 'https://s.shopee.co.id/drafcontoh' }] });
	console.log('Data contoh terisi.');
}

main().catch((err) => {
	console.error('Gagal:', err instanceof Error ? err.message : err);
	process.exit(1);
});
