# Desain bynana.my.id

Tanggal: 1 November 2026
Status: menunggu persetujuan
Mockup: https://claude.ai/artifact/PoutUGj3EjxWpyKHLseE7e (baris A, C, dan "Halaman ganti tema di admin")

## Untuk apa dan untuk siapa

bynana.my.id adalah halaman link affiliate milik satu orang: pemilik akun "bynana". Dia mempromosikan produk campuran (skincare, rumah, fashion, dan lainnya) di TikTok, Shopee, Instagram, Facebook, dan Threads, dengan pengikut yang kebanyakan perempuan. Dia punya lebih dari satu akun di beberapa platform.

Saat ini sudah ada 600+ produk, dan setiap hari bertambah sekitar 5. Link-nya selama ini hanya ditaruh bergantian di bio, jadi belum ada daftar produk di mana pun. Pengikut yang melihat produk di video belum punya tempat untuk menemukannya lagi.

Situs ini menyelesaikan dua hal:

1. **Untuk pengunjung:** satu alamat untuk menemukan produk yang dibahas di video, lewat nomor atau nama, lalu langsung ke toko.
2. **Untuk pemilik:** satu tempat untuk menyimpan dan mengelola semua link dari HP-nya, ditambah data link mana yang diklik.

Referensi pola: milkshake.app (situs mini bergaya kartu). Polanya yang diambil, tampilannya tidak ditiru.

## Tujuan

- Pengunjung yang datang dari browser bawaan TikTok atau Instagram bisa menemukan produk bernomor dalam beberapa detik, dengan data seluler.
- Pemilik bisa menambah satu produk dalam kurang dari satu menit dari HP, dan menambah banyak produk sekaligus dengan menempel daftar link.
- Pemilik bisa memilih tampilan situs sendiri dari dua tema, A (Blok warna) atau C (Kartu pastel), dan menggantinya kapan saja.
- Setiap klik ke toko tercatat, tanpa cookie dan tanpa layanan pihak ketiga.

## Bukan tujuan

- Banyak pengguna atau pendaftaran. Hanya ada satu pemilik.
- Blog atau artikel panjang, komentar, dan newsletter.
- Mengambil foto dan harga otomatis dari Shopee, TikTok Shop, atau toko lain dengan cara mengakali pemblokiran.
- Shopee Affiliate Open API. Hanya disiapkan tempatnya, belum diaktifkan.
- Mode gelap, lebih dari dua tema, dan versi bahasa lain.

## Yang dianggap gagal walaupun situsnya jalan

- Halaman publik terasa lambat di browser bawaan TikTok atau Instagram.
- Panel admin hanya nyaman dipakai di laptop.
- Situs terlihat seperti template AI generik (lihat aturan desain di bawah).
- Ada angka, ulasan, atau klaim karangan di halaman.
- Ada password atau secret di repo.

## Batasan

- Hosting di VPS milik pengguna lewat aaPanel (Node Project dan Proxy Project), dengan Cloudflare untuk DNS dan SSL. VPS yang sama sudah menjalankan situs lain, termasuk Node Project di port 3100. Node v24 tersedia di `/www/server/nodejs/v24.13.0/bin`, sedangkan Node bawaan terminal masih v20. bynana memakai port 3200, folder kode `/opt/bynana`, dan folder data `/opt/bynana-data`. Server: Ubuntu 22, 2 core, RAM 7,75 GB (sekitar 3 GB terpakai oleh 10 situs), disk 38,5 dari 96,7 GB terpakai. Heap Node dibatasi 256 MB supaya tetap hemat walaupun RAM masih longgar. Nameserver bynana.my.id saat ini masih bawaan indo.domains dan harus dipindah ke Cloudflare.
- Repo: github.com/farhanfdlhq/bynana. Pekerjaan di branch `dev`. Tidak di-merge ke `main` tanpa permintaan.
- Tidak boleh ada secret di kode atau repo. Akun admin dibuat dari terminal server.
- Tidak berbagi kode, nama, atau desain dengan proyek qiran.
- Skill yang wajib dipakai: superpowers, taste-skill + anti-slop + style-ui (UI dan teks), logo-generator, claude-seo, dan security-audit (Cloudflare).

## Pendekatan yang dipertimbangkan

| Pendekatan | Kelebihan | Kekurangan |
| --- | --- | --- |
| **SvelteKit + SQLite di VPS (dipilih)** | Halaman publik bisa dikirim sebagai HTML hampir tanpa JavaScript. Panel admin interaktif dengan framework yang sama. RAM kecil. Satu file database. | Satu framework lagi yang harus dipelajari kalau kamu ingin mengubah kode sendiri. |
| Next.js + SQLite di VPS | Familiar dari proyek lain. | JavaScript dan RAM lebih besar untuk situs satu halaman katalog. |
| Astro statis di Cloudflare Pages | Paling cepat dan gratis. | Tidak ada panel admin di HP. Link harus diubah lewat file. Gugur karena pemilik mengelola sendiri dari HP. |

Dipilih SvelteKit karena pemilik mengelola sendiri dari HP (butuh panel admin), sementara pengunjungnya datang dari browser bawaan aplikasi dengan data seluler (butuh halaman ringan).

## Keputusan yang sudah diambil bersama

### Tema

Ada dua tema lengkap yang dipilih pemilik dari **Admin → Atur → Tampilan situs**:

- **A · Blok warna:** latar putih, pink `#FF4F9A`, hijau limau `#D7F75B`, hitam `#141414`, huruf Bricolage Grotesque, dan sudut sangat bulat. Susunan: kepala halaman pink penuh berisi foto, nama, dan tombol akun; kolom cari; kategori; kartu promo; grid produk 2 kolom dengan nomor di sudut foto.
- **C · Kartu pastel:** latar `#FFF0F4`, pink pastel, mint, aprikot, dan plum tua `#2A0F1F`, huruf Unbounded (judul) dan Figtree (teks). Susunan: kartu besar yang bisa digeser di atas (profil, promo, video, link), titik penanda kartu, lalu katalog dengan cari, kategori, dan grid produk.

Tema mengubah **seluruh susunan dan tampilan halaman publik**, bukan hanya warna. Panel admin memakai warna dan huruf tema yang aktif, dengan susunan menu yang sama di kedua tema. Isi (produk, nomor, link, kartu, statistik) sama untuk kedua tema. Pergantian berlaku langsung tanpa deploy. Ada tombol "Lihat dulu" untuk melihat tema lain sebelum dipakai.

### Halaman publik

- Profil: foto, nama, satu kalimat bio, dan tombol akun sosmed. Satu platform boleh punya lebih dari satu akun, masing-masing dengan label.
- Kartu atas yang dikelola pemilik: promo (judul, teks, tombol ke kategori atau URL), link (judul dan URL), video (tautan ke TikTok, Reels, atau YouTube, ditampilkan sebagai gambar sampul yang membuka aplikasinya, tanpa embed pihak ketiga), dan teks. Kartu bisa diurutkan dan disembunyikan, dan boleh diberi tanggal mulai dan selesai.
- Pencarian "Nomor berapa di video?": ketik nomor untuk langsung ke produk itu, atau ketik nama untuk mencari. Pencarian tetap jalan tanpa JavaScript (form biasa).
- Kategori dibuat bebas oleh pemilik.
- Produk terbaru tampil di atas. Daftar dimuat bertahap, tidak sekaligus 600.
- Setiap produk punya nomor unik, nama, foto, harga (boleh kosong), kategori, dan satu atau lebih link toko (Shopee, TikTok Shop, Tokopedia, Lazada, atau lainnya).
- Alamat pendek per produk: `bynana.my.id/614` membuka halaman produk nomor 614. Ini bisa disebut langsung di video.
- Semua tombol ke toko lewat `bynana.my.id/go/<nomor>/<toko>` supaya kliknya tercatat, lalu diteruskan ke link affiliate yang tersimpan.

### Panel admin (`/admin`)

- Dibuat untuk HP dulu. Bisa dipasang ke layar utama HP seperti aplikasi.
- Menu bawah: **Produk**, **Kartu**, **Klik**, **Atur**, plus tombol **Tambah** yang menonjol.
- **Tambah satu produk:** tempel link (tokonya terdeteksi otomatis dan nama terisi kalau bisa dibaca dari alamatnya), pilih foto dari galeri, isi atau periksa nama, harga opsional, kategori, lalu "Simpan dan tambah lagi". Nomor otomatis (nomor terbesar + 1) tapi bisa diubah manual, dengan cek bentrok.
- **Tempel banyak:** tempel banyak link, satu per baris. Sistem membuat draf bernomor berurutan, mengenali tokonya, dan mengisi nama dari alamat produk kalau bisa. Draf yang belum punya foto atau nama ditandai. Draf tidak tampil di situs sampai diterbitkan.
- **Produk:** cari nomor atau nama, saring Terbaru, Paling diklik, atau Draf. Edit, sembunyikan, arsipkan, terbitkan.
- **Kartu:** kelola kartu atas dan akun sosmed.
- **Klik:** jumlah klik per produk, per toko, per kartu, dan per akun untuk 7 hari, 30 hari, dan semua waktu. Hanya angka asli dari database.
- **Atur:** tema, profil (foto, nama, bio), kategori, akun admin (ganti password), dan pengaturan SEO.

### Mengisi 600 produk lama dan nomor yang sudah dipakai

Nomor produk sudah dipakai di caption dan video, misalnya "klik link di bio no.459". Nomor lama itu harus tetap berlaku, jadi:

- Nomor bisa diisi manual saat menambah produk. Sistem menolak nomor yang sudah dipakai.
- Di tempel banyak, setiap baris boleh diawali nomor: `459 https://s.shopee.co.id/...`. Baris tanpa nomor mendapat nomor otomatis.
- Nomor otomatis selalu nomor terbesar yang ada + 1. Nomor yang dihapus atau diarsipkan tidak dipakai ulang, supaya video lama tidak menunjuk ke produk lain.
- Kalau seseorang membuka nomor yang belum diisi atau sudah diarsipkan, halaman menampilkan pesan yang jelas dan tetap menyediakan kolom cari.

Belum ada daftar yang bisa diimpor otomatis. Jalur yang dibangun: tempel banyak link dan tambah satu produk. Jalur Shopee Affiliate Open API disiapkan sebagai modul yang mati sampai pemilik mendapat akses API.

### Logo

Dibuat dengan logo-generator: minimal 6 opsi, kamu memilih, lalu dibuat favicon, ikon aplikasi, apple-touch-icon, dan gambar OG dari logo terpilih. Logo harus terbaca di kedua tema.

## Keputusan builder (usulan saya, bisa dikoreksi)

- **Stack:** SvelteKit (Svelte 5) dengan adapter-node, Node 22 LTS, `better-sqlite3`, `sharp` untuk gambar, dan Vitest + Playwright untuk tes. Semua versi dikunci di `package.json`.
- **Database:** SQLite dalam mode WAL di folder data di luar folder kode. Tabel utama: `settings`, `social_accounts`, `cards`, `categories`, `products`, `product_links`, `click_daily`, `admin_user`, `sessions`, `login_attempts`. Migrasi berupa file SQL bernomor.
- **Klik:** dicatat per target per hari (`click_daily`), tanpa cookie, tanpa menyimpan IP. Bot dikenali dari user agent dan tidak dihitung.
- **Produk dengan beberapa toko di tema C:** tombol "Beli · harga" langsung ke toko kalau hanya ada satu toko, dan ke halaman produk `/614` kalau ada beberapa toko.
- **Kartu geser di tema C:** CSS scroll-snap, tanpa library JavaScript.
- **Gambar:** diunggah dari HP, diubah ke WebP (800 px dan 400 px), metadata EXIF dibuang, nama file acak. Foto di bawah layar pertama dimuat lazy.
- **Membaca link (tempel banyak):** server mengikuti redirect link pendek ke alamat produk asli, lalu membaca nama dari alamat (Shopee, Tokopedia, Lazada). Batasannya: hanya domain toko yang dikenal, maksimal 5 redirect, batas waktu 5 detik, alamat IP privat diblokir, dan user agent jujur bernama bynana. Tidak ada usaha mengakali proteksi bot. Kalau gagal, draf tetap dibuat tanpa nama.
- **Login:** satu akun admin dengan email dan password, dibuat lewat `npm run admin -- create` di server. Password di-hash dengan scrypt. Sesi disimpan sebagai hash di database, cookie `httpOnly`, `Secure`, `SameSite=Lax`. Percobaan login dibatasi per IP dan per akun.
- **SEO:** title dan description per halaman, canonical, Open Graph dan Twitter Card, `sitemap.xml`, `robots.txt` (admin dan `/go/` tidak diindeks), JSON-LD `Person` atau `ProfilePage` untuk beranda dan `Product` tanpa harga untuk halaman produk (harga affiliate cepat berubah, jadi tidak dicantumkan sebagai penawaran). Gambar OG per produk dibuat dari foto produk dan logo.
- **Keamanan:** security-audit dijalankan di akhir. Semua temuan ditutup dan dilaporkan di `docs/AUDIT-KEAMANAN.md`. Hal yang sudah pasti diperiksa: SSRF pada pembaca link, open redirect pada `/go/` (hanya ke URL yang tersimpan), validasi upload, CSRF (cek origin bawaan SvelteKit), header keamanan dan CSP, serta pembatasan login.
- **Desain:** taste-skill (aturan rumah dan inspector), anti-slop (UI, layout mobile, copywriting), dan style-ui sebagai referensi komponen. Tanpa gradien, tanpa emoji di UI, tanpa eyebrow, tanpa angka karangan. Teks dalam bahasa Indonesia sehari-hari, memakai "aku" seperti di mockup.
- **Backup:** skrip backup harian database dan gambar (simpan 14 hari) lewat Cron aaPanel.
- **Deploy:** skrip `deploy.sh` yang menarik kode, build di folder terpisah, lalu menukar dan me-restart Node Project. Dengan begitu situs tidak mati saat build.

## Dokumentasi yang dibuat

- `README.md`: perkenalan situs.
- `docs/DEPLOY-AAPANEL.md`: langkah demi langkah Cloudflare (pindah nameserver, DNS, SSL Origin Certificate, mode Full strict), aaPanel (Node Project, Proxy Project, header `X-Forwarded-Proto`), membuat akun admin, backup, dan update. Semua perintah siap tempel di Terminal aaPanel, satu blok per perintah.
- `PANDUAN-MENULIS.md`: untuk pemilik, dengan bahasa sederhana. Isinya cara masuk, menambah produk, tempel banyak, kartu, ganti tema, dan membaca klik.
- `docs/AUDIT-KEAMANAN.md`: hasil audit keamanan dan perbaikannya.

## Selesai berarti

- Kedua tema lolos inspector taste-skill tanpa FAIL di lebar 390, 768, dan 1440, dan sudah dicek lewat screenshot.
- Unit test dan tes e2e lolos, mencakup: tambah produk, tempel banyak, pencarian nomor, redirect `/go/` beserta pencatatan klik, ganti tema, dan login beserta batasnya.
- Audit keamanan selesai, tanpa temuan tinggi atau kritis yang terbuka.
- Dokumentasi lengkap, dan semua sudah di-push ke `dev`.
