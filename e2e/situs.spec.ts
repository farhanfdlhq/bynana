import { expect, test, type Page } from '@playwright/test';

const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_ly_34.0';

async function login(page: Page) {
	await page.goto('/admin/masuk');
	await page.fill('#email', 'tes@bynana.my.id');
	await page.fill('#password', 'password-tes-panjang');
	await page.click('button[type=submit]');
	await page.waitForURL('**/admin/produk');
}

test.describe.serial('bynana', () => {
	test('beranda tampil tanpa JavaScript dan memuat produk', async ({ page }) => {
		const res = await page.goto('/');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText('bynana');
		await expect(page.locator('script[src], script[type=module]')).toHaveCount(0);
		await expect(page.getByRole('link', { name: /Nomor 469/ })).toBeVisible();
	});

	test('cari nomor dalam berbagai bentuk langsung ke produknya', async ({ page }) => {
		for (const q of ['no.459', '#459', ' 459 ', 'No 459']) {
			await page.goto('/cari?q=' + encodeURIComponent(q));
			await expect(page).toHaveURL(/\/459$/);
		}
		await expect(page.locator('h1')).toHaveText('Wajan Anti Lengket 24 cm');
	});

	test('cari nama', async ({ page }) => {
		await page.goto('/');
		await page.fill('#cari', 'serum');
		await page.click('button:has-text("Cari")');
		await expect(page.locator('h1')).toContainText('cocok dengan "serum"');
		await expect(page.getByText('Serum Niacinamide 10% 30 ml')).toBeVisible();
	});

	test('nomor yang tidak ada: 404 dengan pesan ramah dan kolom cari', async ({ page }) => {
		const res = await page.goto('/999');
		expect(res?.status()).toBe(404);
		await expect(page.locator('h1')).toContainText('Nomor 999 belum ada');
		await expect(page.locator('#cari')).toBeVisible();
	});

	test('/go/ mencatat klik dan meneruskan ke link tersimpan, bukan alamat dari URL', async ({ request }) => {
		const res = await request.get('/go/459/shopee', { maxRedirects: 0, headers: { 'user-agent': PHONE_UA } });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/^https:\/\/s\.shopee\.co\.id\//);
		const bad = await request.get('/go/459/https%3A%2F%2Fevil.example', { maxRedirects: 0 });
		expect(bad.status()).toBe(303);
		expect(bad.headers()['location']).toBe('/459');
	});

	test('admin terkunci tanpa login', async ({ request }) => {
		const res = await request.get('/admin/produk', { maxRedirects: 0 });
		expect(res.status()).toBe(303);
		expect(res.headers()['location']).toContain('/admin/masuk');
	});

	test('tambah satu produk dengan foto dan nomor lama', async ({ page }) => {
		await login(page);
		await page.goto('/admin/produk/baru', { waitUntil: 'networkidle' });
		await page.fill('#link-0', 'https://shopee.co.id/Masker-Wajah-Clay-i.111.222');
		await page.click('#price');
		await expect(page.locator('#name')).toHaveValue('Masker Wajah Clay');
		await page.fill('#price', '25.000');
		await page.fill('#number', '400');
		await page.setInputFiles('input[name=foto]', { name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
		await page.click('button[formaction="?/lagi"]');
		await expect(page.locator('.toast')).toContainText('Nomor 400 tersimpan');
		const res = await page.goto('/400');
		expect(res?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText('Masker Wajah Clay');
		await expect(page.locator('.price')).toHaveText('Rp25.000');
	});

	test('nomor yang sudah dipakai ditolak dengan pesan jelas', async ({ page }) => {
		await login(page);
		await page.goto('/admin/produk/baru', { waitUntil: 'networkidle' });
		await page.fill('#link-0', 'https://s.shopee.co.id/lain123');
		await page.fill('#name', 'Produk lain');
		await page.fill('#number', '459');
		await page.click('button[formaction="?/lagi"]');
		await expect(page.locator('.field-error')).toContainText('Nomor 459 sudah dipakai');
		await expect(page.locator('#name')).toHaveValue('Produk lain');
	});

	test('tempel banyak link membuat draf bernomor', async ({ page }) => {
		await login(page);
		await page.goto('/admin/produk/baru?cara=banyak', { waitUntil: 'networkidle' });
		await page.fill('#daftar', 'no.480 https://shopee.co.id/Sisir-Kayu-i.9.9\nCek ini di Shopee! https://www.lazada.co.id/products/payung-lipat-i55-s66.html\nhttps://shopee.co.id/Sisir-Kayu-i.9.9\nbukan link');
		await page.getByRole('button', { name: 'Buat 2 draf' }).click();
		const result = page.locator('.result');
		await expect(result).toContainText('2 draf dibuat');
		await expect(result).toContainText('Sisir Kayu');
		await expect(result).toContainText('Payung Lipat');
		await expect(result).toContainText('Baris 3: link yang sama');
		await expect(result).toContainText('Baris 4: tidak ada link');
		const draft = await page.request.get('/480');
		expect(draft.status()).toBe(404);
	});

	test('ganti tema mengubah seluruh halaman publik, dan bisa dilihat dulu', async ({ page, browser }) => {
		await login(page);
		const preview = await page.goto('/?pratinjau=pastel');
		expect(await preview?.text()).toContain('data-theme="pastel"');
		const visitor = await browser.newPage();
		await visitor.goto('/?pratinjau=pastel');
		await expect(visitor.locator('html')).toHaveAttribute('data-theme', 'blok');

		await page.goto('/admin/atur', { waitUntil: 'networkidle' });
		await page.check('input[value=pastel]');
		await page.click('button:has-text("Pakai tema ini")');
		await expect(page.locator('.toast').first()).toContainText('Kartu pastel');
		await visitor.goto('/');
		await expect(visitor.locator('html')).toHaveAttribute('data-theme', 'pastel');
		await expect(visitor.locator('.deck')).toBeVisible();
		await page.goto('/admin/atur', { waitUntil: 'networkidle' });
		await page.check('input[value=blok]');
		await page.click('button:has-text("Pakai tema ini")');
		await visitor.goto('/');
		await expect(visitor.locator('html')).toHaveAttribute('data-theme', 'blok');
		await visitor.close();
	});

	test('hapus kategori memakai dialog tema, bukan confirm bawaan', async ({ page }) => {
		await login(page);
		await page.goto('/admin/atur', { waitUntil: 'networkidle' });
		page.on('dialog', () => {
			throw new Error('dialog bawaan browser muncul');
		});
		const row = page.locator('li.cat').last();
		await expect(row.locator('input[name=name]')).toHaveValue('Dapur');
		await row.getByRole('button', { name: 'Hapus' }).click();
		const dlg = page.locator('dialog[open]');
		await expect(dlg).toContainText('Hapus kategori Dapur?');
		await dlg.getByRole('button', { name: 'Batal' }).click();
		await expect(page.locator('li.cat')).toHaveCount(4);
		await row.getByRole('button', { name: 'Hapus' }).click();
		await page.locator('dialog[open]').getByRole('button', { name: 'Hapus' }).click();
		await expect(page.locator('.toast')).toContainText('Kategori dihapus');
		await expect(page.locator('li.cat')).toHaveCount(3);
	});

	test('kartu baru: pilih jenis, arah tombol, dan error di form', async ({ page }) => {
		await login(page);
		await page.goto('/admin/kartu', { waitUntil: 'networkidle' });
		await page.locator('details.add summary').first().click();
		const f = page.locator('details.add form').first();
		await f.getByText('Video', { exact: true }).click();
		await f.locator('input[name=title]').fill('Video baru');
		await f.getByRole('button', { name: 'Simpan kartu' }).click();
		await expect(page.locator('.notice.error')).toContainText('butuh link');
		await f.locator('input[name=url]').fill('https://www.tiktok.com/@bynana/video/1');
		await f.getByRole('button', { name: 'Simpan kartu' }).click();
		await expect(page.locator('.toast')).toContainText('Kartu baru ditambahkan');
		await expect(page.getByText('Video baru', { exact: true })).toBeVisible();
		await expect(page.locator('details.add input[name=title]').first()).toHaveValue('');
	});

	test('teks bagian bawah halaman bisa diubah dan dikosongkan', async ({ page, request }) => {
		await login(page);
		await page.goto('/admin/atur', { waitUntil: 'networkidle' });
		await page.fill('#footer_note', 'Harga bisa berubah sewaktu-waktu.');
		await page.click('button:has-text("Simpan profil")');
		await expect(page.locator('.toast')).toContainText('Profil disimpan');
		expect(await (await request.get('/')).text()).toContain('Harga bisa berubah sewaktu-waktu.');
		await page.fill('#footer_note', '');
		await page.click('button:has-text("Simpan profil")');
		await expect(page.locator('.toast')).toContainText('Profil disimpan');
		expect(await (await request.get('/')).text()).not.toContain('class="note');
	});

	test('ikon mata menampilkan dan menyembunyikan password', async ({ page }) => {
		await page.goto('/admin/masuk', { waitUntil: 'networkidle' });
		await page.fill('#password', 'rahasia-sekali');
		await expect(page.locator('#password')).toHaveAttribute('type', 'password');
		await page.getByRole('button', { name: 'Tampilkan password' }).click();
		await expect(page.locator('#password')).toHaveAttribute('type', 'text');
		await page.getByRole('button', { name: 'Sembunyikan password' }).click();
		await expect(page.locator('#password')).toHaveAttribute('type', 'password');
	});

	test('statistik klik menghitung klik dari HP', async ({ page }) => {
		await login(page);
		await page.goto('/admin/klik');
		await expect(page.locator('.total strong')).not.toHaveText('0');
	});

	test('login dibatasi setelah 5 kali salah', async ({ page }) => {
		for (let i = 0; i < 5; i++) {
			await page.goto('/admin/masuk');
			await page.fill('#email', 'salah@bynana.my.id');
			await page.fill('#password', 'password-salah-' + i);
			await page.click('button[type=submit]');
			await expect(page.locator('.notice.error')).toContainText('salah');
		}
		await page.goto('/admin/masuk');
		await page.fill('#email', 'salah@bynana.my.id');
		await page.fill('#password', 'password-salah-x');
		await page.click('button[type=submit]');
		await expect(page.locator('.notice.error')).toContainText('Terlalu banyak percobaan');
	});
});
