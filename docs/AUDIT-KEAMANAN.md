# Audit keamanan bynana

Tanggal: 1 November 2026
Versi yang diperiksa: branch `dev`, sebelum deploy pertama
Panduan yang dipakai: skill [security-audit](https://github.com/cloudflare/security-audit-skill) dari Cloudflare

## Ringkasan

Tidak ada temuan tinggi atau kritis yang terbuka. Ada tiga temuan yang semuanya sudah diperbaiki di kode. Ada dua hal yang bergantung pada pengaturan server dan perlu dicek saat deploy. Empat peringatan `npm audit` (semuanya tingkat rendah) sudah dinilai dan tidak berlaku untuk cara aplikasi ini dipakai.

| No | Temuan | Tingkat | Status |
| --- | --- | --- | --- |
| 1 | Banyak percobaan login sekaligus bisa menghabiskan RAM server | Sedang | Diperbaiki |
| 2 | Orang lain bisa mengunci login pemilik dengan sengaja salah password | Rendah | Diperbaiki |
| 3 | IP pengunjung bisa dipalsukan kalau server dihubungi langsung, bukan lewat Cloudflare | Sedang | Diperbaiki di kode dan panduan deploy, perlu dicek di server |
| 4 | `ORIGIN` wajib benar di server | Perlu dicek | Ada di panduan deploy |
| 5 | Port aplikasi tidak boleh terbuka ke internet | Perlu dicek | Ada di panduan deploy |

## Cara pemeriksaan

Skill security-audit dirancang untuk dijalankan oleh beberapa sub-agen: pemburu per bagian, kritikus cakupan, dan pemeriksa ulang yang independen. Audit ini dijalankan oleh satu pemeriksa yang mengikuti prinsip dan daftar serangan dari skill itu (`ATTACK-CLASSES.md`, `WEB-PROTOCOL-AND-AUTH.md`, `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`, `CLIENT-SIDE.md`, `SUPPLY-CHAIN-AND-RELEASE.md`). Artinya, belum ada pemeriksaan ulang independen dan belum ada ledger cakupan yang divalidasi skrip. Untuk situs satu pemilik dengan satu akun admin, cakupan ini memadai. Tetap tidak bisa dianggap "semua celah pasti tertutup".

Setiap temuan harus memenuhi syarat dari skill: ada pihak yang tidak dipercaya, ada batas yang dilewati, dan ada akibat nyata. Bukti diambil dari kode dan dari tes lokal: unit test, tes e2e Playwright terhadap build produksi, dan request `curl` ke server lokal. Server sungguhan tidak diuji dari luar.

Batas kepercayaan yang diperiksa:

- **Pengunjung → situs publik:** pencarian, halaman nomor, kategori, `/go/`, `/k/`, `/a/`, `/uploads/`, `/og/`, sitemap.
- **Pengunjung → panel admin:** login, sesi, semua form dan endpoint di `/admin`.
- **Server → internet:** pembaca link untuk tempel banyak (mengikuti redirect toko).
- **Foto unggahan → server:** pemrosesan gambar.
- **Server → Cloudflare dan Nginx:** IP pengunjung, protokol, dan cache.
- **Rantai pasok:** paket npm.

## Temuan

### 1. Banyak percobaan login sekaligus bisa menghabiskan RAM server (Sedang, diperbaiki)

**Masalah.** Password dicek dengan scrypt, dan setiap pengecekan memakai sekitar 32 MB memori. Batas percobaan login per IP baru berlaku setelah percobaan dicatat. Akibatnya, puluhan request login yang datang bersamaan dari banyak IP bisa menjalankan puluhan pengecekan scrypt sekaligus. RAM server dipakai bersama 10 situs lain.

**Perbaikan.** Pengecekan password yang berjalan bersamaan dibatasi 2, dengan antrean maksimal 16. Request di luar itu langsung ditolak dengan pesan "Server sedang sibuk", tanpa menjalankan scrypt. Kode: `withVerifySlot` di `src/lib/server/auth.ts`.

**Bukti.** Tes `pengecekan password dibatasi yang berjalan bersamaan` di `tests/auth.test.ts`: dari 30 percobaan serentak, 18 diproses dan sisanya ditolak.

### 2. Orang lain bisa mengunci login pemilik (Rendah, diperbaiki)

**Masalah.** Awalnya batas 5 kali gagal berlaku sama untuk IP dan untuk email. Orang yang tahu email admin bisa sengaja salah password 5 kali dari HP-nya sendiri, dan pemilik ikut terkunci 15 menit dari HP mana pun.

**Perbaikan.** Batas per IP tetap 5 kali per 15 menit. Batas per email dinaikkan jadi 20 kali per 15 menit, supaya serangan dari banyak IP tetap tertahan tanpa mudah mengunci pemilik. Kode: `checkLoginAllowed` di `src/lib/server/auth.ts`.

**Bukti.** Tes `percobaan ke-6 dalam 15 menit diblokir` (IP lain dengan email sama tetap boleh) dan `email dikunci setelah 20 kali gagal dari banyak IP` di `tests/auth.test.ts`. Tes e2e `login dibatasi setelah 5 kali salah`.

### 3. IP pengunjung bisa dipalsukan (Sedang, diperbaiki, perlu dicek di server)

**Masalah.** Rencana awal membaca IP pengunjung dari header `CF-Connecting-IP`. Header itu bisa dikirim siapa saja yang menghubungi IP server secara langsung, tanpa lewat Cloudflare. Dengan mengganti nilainya setiap request, penyerang bisa melewati batas login per IP.

**Perbaikan.** Aplikasi sekarang membaca `X-Real-IP`, yang selalu ditulis ulang oleh Nginx. Nginx diatur supaya hanya memercayai `CF-Connecting-IP` kalau request datang dari daftar IP resmi Cloudflare (`set_real_ip_from`). Pengaturan: `ADDRESS_HEADER=X-Real-IP` di `.env.example`, dan langkah 10 di `docs/DEPLOY-AAPANEL.md`.

**Yang perlu dicek di server.** Langkah 10 panduan deploy sudah dijalankan dan `nginx -t` berhasil. Kalau aaPanel menulis ulang config Nginx, langkah itu harus diulang.

### 4. `ORIGIN` wajib benar (perlu dicek di server)

SvelteKit menolak form dari situs lain dengan membandingkan header `Origin` dan alamat situs. Alamat situs diambil dari variabel `ORIGIN`. Kalau `ORIGIN` kosong, alamat diambil dari header request, sehingga link kanonis dan gambar pratinjau bisa memakai host yang salah. Aplikasi menulis peringatan di log saat jalan di produksi tanpa `ORIGIN`. Panduan deploy langkah 5 mengisinya dengan `https://bynana.my.id`.

### 5. Port aplikasi tidak boleh terbuka (perlu dicek di server)

Aplikasi mendengarkan di `127.0.0.1:3200` (`HOST=127.0.0.1`), jadi hanya Nginx di VPS yang bisa menghubunginya. Langkah 11 panduan deploy berisi cara mengeceknya dari luar.

## Kontrol yang diperiksa dan sudah benar

| Area | Yang diperiksa | Bukti |
| --- | --- | --- |
| Akses admin | Semua halaman dan endpoint `/admin` kecuali `/admin/masuk` mengalihkan ke login tanpa sesi, termasuk `/admin/api/baca-link` | `src/hooks.server.ts`; tes e2e `admin terkunci tanpa login`; `curl` ke endpoint API tanpa sesi → 303 |
| Password | scrypt (N=2^15, salt 16 byte), perbandingan waktu-konstan, minimal 10 karakter, waktu proses sama untuk email yang tidak terdaftar | `src/lib/server/auth.ts`; `tests/auth.test.ts` |
| Sesi | Token acak 32 byte, yang disimpan hanya hash SHA-256, cookie `httpOnly`, `SameSite=Lax`, `Secure` di HTTPS, kedaluwarsa 30 hari, semua sesi dihapus saat password diganti | `tests/auth.test.ts` |
| CSRF | Form dari situs lain ditolak | `curl` POST login dengan `Origin: https://evil.example` → 403 |
| Pengalihan setelah login | Parameter `lanjut` hanya menerima alamat di dalam `/admin` | `safeNext` di `src/routes/admin/masuk/+page.server.ts` |
| Open redirect | `/go/`, `/k/`, `/a/` hanya mengalihkan ke URL yang tersimpan di database. Toko atau nomor yang tidak ada dialihkan ke halaman nomornya sendiri | Tes e2e `/go/ ... bukan alamat dari URL`; `curl /go/459/javascript:alert(1)` → 303 ke `/459` |
| Link yang disimpan | Hanya `https` (http dinaikkan ke https), tanpa user:password di URL. `javascript:` dan skema lain ditolak | `normalizeAffiliateUrl`; `tests/stores.test.ts`, `tests/products.test.ts` |
| XSS | Semua teks dirender oleh Svelte dengan escape. JSON-LD di-escape (`<` jadi `<`). Halaman publik tanpa JavaScript | `src/lib/components/Seo.svelte`; tes e2e beranda tanpa script |
| Header | CSP (`script-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS di HTTPS | `curl -D -` ke build produksi |
| SSRF (pembaca link) | Hanya host toko yang dikenal, hanya https port 443, alamat IP langsung ditolak, IP privat ditolak saat DNS lookup (melindungi dari DNS rebinding), maksimal 5 redirect, batas waktu 5 detik, tidak membaca isi halaman | `src/lib/server/linkreader.ts`; `tests/linkreader.test.ts` |
| Upload | Maksimal 15 MB, dibaca ulang oleh `sharp` (SVG dan format aneh ditolak), batas 60 juta piksel, disimpan ulang sebagai WebP tanpa metadata, nama file acak 64 bit | `tests/images.test.ts` |
| Path traversal | `/uploads/` hanya menerima nama `[a-f0-9]{16}(-400)?.webp` | `curl /uploads/..%2f..%2fbynana.sqlite` → 404 |
| SQL injection | Semua query memakai parameter. Pencarian membuang `%`, `_`, dan `\` | `src/lib/server/products.ts` |
| Draf bocor | Draf dan arsip tidak muncul di beranda, pencarian, sitemap, `/go/`, `/og/`, atau halaman nomor | Tes e2e tempel banyak (`/480` draf → 404); `tests/products.test.ts` |
| Pratinjau tema | `?pratinjau=` hanya berlaku untuk admin yang sedang masuk, dan halamannya tidak di-cache | Tes e2e ganti tema |
| Cache | Halaman admin `no-store`. Halaman publik selalu dicek ulang, supaya ganti tema dan produk baru langsung terlihat | `src/hooks.server.ts` |
| Secret | Tidak ada password, token, atau key di repo. `.env` di-ignore. Password admin dibuat lewat prompt tersembunyi, tidak lewat argumen perintah | `.gitignore`, `scripts/admin.ts` |
| Backup | File backup `chmod 600` di folder `chmod 700` | `scripts/backup.sh` |

## Paket npm

`npm audit` untuk dependensi produksi (`better-sqlite3`, `sharp`): **0 celah**.

`npm audit` untuk dependensi build melaporkan 4 peringatan **rendah**. Perbaikannya hanya ada di SvelteKit 3, yang mengubah banyak API. Keempatnya sudah dinilai:

| Paket | Peringatan | Berlaku? |
| --- | --- | --- |
| `@sveltejs/kit` < 3 | [GHSA-pfhg-q3qv-9q6r](https://github.com/advisories/GHSA-pfhg-q3qv-9q6r) pengalihan ke situs lain lewat form yang di-enhance | Tidak. Semua `redirect` di form action menuju alamat tetap di situs ini, dan `lanjut` setelah login dibatasi ke `/admin`. Tidak ada form action yang mengalihkan ke alamat dari input pengguna. |
| `@sveltejs/kit` < 3 | [GHSA-27mw-82g8-phjj](https://github.com/advisories/GHSA-27mw-82g8-phjj) XSS lewat header cache-control di halaman prerender | Tidak. Tidak ada halaman yang di-prerender. |
| `cookie` < 0.7 | [GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x) nama, path, atau domain cookie dengan karakter aneh | Tidak. Aplikasi hanya membuat satu cookie dengan nama dan path tetap. |
| `deepmerge` | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) prototype poisoning | Tidak. Hanya dipakai saat build untuk menggabungkan konfigurasi, tidak saat aplikasi berjalan, dan tidak menerima input pengguna. Peringatan ini juga ada di SvelteKit 3. |

**Saran lanjutan:** pindah ke SvelteKit 3 sebagai pekerjaan terpisah, supaya peringatan ini hilang dan paket tetap mendapat pembaruan keamanan.

## Di luar kode bynana

Dua hal ini terlihat di screenshot aaPanel dan memengaruhi keamanan seluruh server, termasuk bynana:

- **Panel aaPanel dibuka lewat `http` biasa** di port 40391. Password panel terkirim tanpa enkripsi setiap kali login. Aktifkan **Settings → Panel SSL**.
- **Ada peringatan celah keamanan PHP** di beranda aaPanel. Update lewat **App Store → Update App List → PHP**.

## Yang belum diperiksa

- Konfigurasi server yang sebenarnya (Nginx, firewall, Cloudflare) setelah deploy. Ini harus dicek dengan langkah 10 dan 11 di panduan deploy.
- Kode di dalam paket pihak ketiga (`sharp`/libvips, `better-sqlite3`, SvelteKit) di luar `npm audit`.
- Uji beban dari luar. Server sungguhan tidak diserang atau diuji, sesuai aturan skill.
