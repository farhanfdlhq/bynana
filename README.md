# bynana.my.id

**[bynana.my.id](https://bynana.my.id)** adalah halaman link affiliate milik akun bynana. Isinya produk yang dibahas di TikTok, Instagram, Threads, Facebook, dan Shopee. Setiap produk punya nomor, dan nomor itu yang disebut di video atau caption. Pengunjung cukup mengetik nomornya untuk langsung ke tokonya.

![Logo bynana](static/brand/bynana-mark.svg)

## Fitur

**Untuk pengunjung**

- Cari produk dengan nomor dari video (`459`, `no.459`, `#459`) atau dengan nama.
- Alamat pendek per produk, misalnya `bynana.my.id/459`.
- Satu produk bisa punya beberapa toko: Shopee, TikTok Shop, Tokopedia, Lazada.
- Kategori, kartu promo dan video, serta tombol semua akun sosmed.
- Halaman publik dikirim sebagai HTML tanpa JavaScript, supaya cepat dibuka dari browser bawaan TikTok dan Instagram.

**Untuk pemilik (panel admin di `/admin`, dibuat untuk HP)**

- Tambah satu produk: tempel link, pilih foto, simpan. Nama terisi dari link kalau tersedia.
- Tempel banyak link sekaligus. Setiap baris boleh diawali nomor lama.
- Dua tema lengkap yang bisa diganti kapan saja: **Blok warna** dan **Kartu pastel**.
- Statistik klik per produk, per toko, per kartu, dan per akun, tanpa cookie.

## Tampilan

| Blok warna | Kartu pastel |
| --- | --- |
| Kepala halaman pink, kolom cari nomor, kartu promo, dan grid produk dengan nomor di sudut foto. Huruf Bricolage Grotesque. | Kartu besar yang bisa digeser di atas, lalu katalog produk. Warna pastel, huruf Unbounded dan Figtree. |

Logonya dua huruf n dari "nana" yang makin tinggi, ditutup titik seperti "no.".

## Dibangun dengan

- [SvelteKit](https://svelte.dev/docs/kit) dan Svelte 5, dengan adapter Node
- SQLite (`better-sqlite3`), satu file database
- `sharp` untuk mengolah foto (WebP, metadata dibuang)
- aaPanel di VPS, Cloudflare untuk DNS dan SSL

## Menjalankan di komputer sendiri

Butuh Node 22 atau lebih baru.

```bash
npm install
```

```bash
DATA_DIR=./data npm run seed -- --contoh
```

```bash
DATA_DIR=./data npm run admin -- create
```

```bash
DATA_DIR=./data npm run dev
```

Buka http://localhost:3200 dan http://localhost:3200/admin.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Mode pengembangan di port 3200 |
| `npm run build` lalu `npm start` | Produksi. `npm start` membaca `.env` |
| `npm test` | Unit test (Vitest) |
| `npm run test:e2e` | Build lalu uji alur di browser (Playwright) dengan database tes terpisah |
| `npm run check` | Pemeriksaan TypeScript dan Svelte |
| `npm run admin -- create \| reset \| list` | Kelola akun admin dari terminal |
| `npm run seed -- --contoh` | Isi data contoh (hanya kalau database kosong) |
| `npm run backup` | Backup database dan foto |
| `npm run deploy` | Update aman di server |

## Struktur

```
src/lib/server/     database, produk, toko dan pembaca link, klik, login, gambar, SEO
src/lib/themes/     tema publik: blok/ (Blok warna) dan pastel/ (Kartu pastel)
src/lib/admin/      komponen panel admin
src/routes/(site)/  halaman publik: beranda, /[nomor], /cari, /kategori/[slug]
src/routes/admin/   panel admin
src/routes/go/      pencatat klik dan pengalih ke toko
scripts/            akun admin, data contoh, deploy, backup
tests/              unit test
e2e/                uji alur di browser
```

Data (database `bynana.sqlite` dan folder `uploads/`) disimpan di `DATA_DIR`, di luar folder kode.

## Dokumen lain

- [Panduan mengelola](PANDUAN-MENULIS.md): untuk pemilik, cara menambah produk, mengganti tema, dan membaca klik
- [Pemasangan di aaPanel dan Cloudflare](docs/DEPLOY-AAPANEL.md): langkah demi langkah, perintah siap tempel
- [Audit keamanan](docs/AUDIT-KEAMANAN.md): hasil pemeriksaan keamanan dan perbaikannya
- [Dokumen desain](docs/superpowers/specs/2026-11-01-bynana-design.md) dan [rencana kerja](docs/superpowers/plans/2026-11-01-bynana.md)

## Lisensi

Kode berlisensi MIT. Huruf Bricolage Grotesque, Unbounded, dan Figtree berlisensi SIL Open Font License (lihat `static/fonts/LICENSE-OFL.txt`).
