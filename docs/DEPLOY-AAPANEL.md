# Memasang bynana di VPS aaPanel dengan Cloudflare

Panduan ini memasang bynana.my.id dari nol. Kerjakan berurutan. Setiap perintah ada di blok sendiri, siap ditempel di **Terminal aaPanel** (menu **Terminal** di kiri). Jalankan sebagai root.

Ringkasan susunan di server:

| Bagian | Nilai |
| --- | --- |
| Folder kode | `/opt/bynana` |
| Folder data (database dan foto) | `/opt/bynana-data` |
| Port aplikasi | `3200` (hanya bisa diakses dari VPS sendiri) |
| Node | v24, sudah terpasang di aaPanel |
| Nama Node Project di aaPanel | `bynana` |

Port 3100 sudah dipakai situs lain, jadi bynana memakai 3200.

## 1. Pindahkan domain ke Cloudflare

1. Masuk ke [dash.cloudflare.com](https://dash.cloudflare.com), klik **Add a domain**, isi `bynana.my.id`, pilih paket **Free**.
2. Cloudflare memberi dua nameserver, misalnya `xxx.ns.cloudflare.com` dan `yyy.ns.cloudflare.com`. Catat keduanya.
3. Buka indo.domains, **Domain Saya → bynana.my.id → Kelola**. Di bagian **Nameserver**, hapus isi kotak, tempel dua nameserver Cloudflare (satu per baris), lalu klik **Simpan nameserver**.
4. Tunggu sampai Cloudflare menandai domain **Active**. Biasanya beberapa menit sampai beberapa jam. Cloudflare mengirim email saat selesai.

## 2. DNS di Cloudflare

Di Cloudflare, buka **bynana.my.id → DNS → Records**, lalu tambahkan:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| A | `@` | `72.61.242.142` | Proxied (awan oranye) |
| CNAME | `www` | `bynana.my.id` | Proxied (awan oranye) |

## 3. Sertifikat SSL dari Cloudflare (Origin Certificate)

1. Buka **SSL/TLS → Overview**, pilih mode **Full (strict)**.
2. Buka **SSL/TLS → Edge Certificates**, nyalakan **Always Use HTTPS**.
3. Buka **SSL/TLS → Origin Server → Create Certificate**. Biarkan pilihan bawaan (RSA, hostname `bynana.my.id` dan `*.bynana.my.id`, 15 tahun), klik **Create**.
4. Cloudflare menampilkan **Origin Certificate** dan **Private Key**. Biarkan halaman ini terbuka, isinya dipakai di langkah 9. Private key hanya tampil sekali. Jangan simpan di repo, chat, atau tempat umum.

## 4. Ambil kode

```bash
cd /opt && git clone https://github.com/farhanfdlhq/bynana.git && cd bynana && git checkout dev
```

Selama pekerjaan belum di-merge ke `main`, pakai branch `dev`. Setelah di-merge, jalankan `git checkout main` di `/opt/bynana`.

## 5. Isi pengaturan (.env)

```bash
cd /opt/bynana && cp .env.example .env && sed -i 's#^DATA_DIR=.*#DATA_DIR=/opt/bynana-data#; s#^ORIGIN=.*#ORIGIN=https://bynana.my.id#' .env && chmod 600 .env && cat .env
```

Pastikan hasilnya berisi `ORIGIN=https://bynana.my.id`, `DATA_DIR=/opt/bynana-data`, `PORT=3200`, dan `HOST=127.0.0.1`. File ini tidak masuk ke Git.

Buat folder data:

```bash
mkdir -p /opt/bynana-data && chown -R www:www /opt/bynana-data && chmod 750 /opt/bynana-data
```

## 6. Pasang paket dan build

Node bawaan terminal masih v20, jadi pakai Node v24 dari aaPanel. Jalankan baris ini setiap membuka terminal baru untuk mengurus bynana:

```bash
export PATH=/www/server/nodejs/v24.13.0/bin:$PATH && node -v
```

Hasilnya harus `v24...`. Lalu:

```bash
cd /opt/bynana && npm ci --include=dev --no-audit --no-fund && npm run build
```

## 7. Buat akun admin

```bash
cd /opt/bynana && npm run admin -- create && chown -R www:www /opt/bynana-data
```

Terminal menanyakan email, lalu password (minimal 10 karakter) dua kali. Saat password diketik, tidak ada yang tampil di layar. Itu normal. Password tidak pernah ditulis di perintah, jadi tidak tersimpan di riwayat terminal.

## 8. Jalankan aplikasi (Node Project)

Di aaPanel, buka **Website → Node Project → Add Node Project**:

| Kolom | Isi |
| --- | --- |
| Project directory | `/opt/bynana` |
| Project name | `bynana` |
| Run command / options | `npm run start` |
| Port | `3200` |
| Node version | v24 |
| Run user | `www` |

Jangan isi domain di sini. Domain diatur lewat Proxy Project di langkah berikutnya.

Cek aplikasinya sudah jalan:

```bash
curl -s http://127.0.0.1:3200/ | grep -o "<title>[^<]*"
```

Hasilnya `<title>bynana: rekomendasi barang...`.

## 9. Sambungkan domain (Proxy Project) dan SSL

1. Di aaPanel, buka **Website → Proxy Project → Add proxy**.
   - Domain: `bynana.my.id` dan `www.bynana.my.id` (satu per baris)
   - Target URL: `http://127.0.0.1:3200`
   - Send Host / Host: `$host`
2. Buka pengaturan proxy itu, tab **SSL → Other certificate** (atau **Certificate**). Tempel **Origin Certificate** dari langkah 3 ke kotak certificate (PEM) dan **Private Key** ke kotak key. Klik **Save**.
3. Nyalakan **Force HTTPS**.

## 10. Header Nginx: protokol asli dan IP pengunjung

Aplikasi perlu tahu dua hal dari Nginx: protokol asli (`X-Forwarded-Proto`) dan IP pengunjung yang benar. IP dipakai untuk membatasi percobaan login.

Pengunjung datang lewat Cloudflare, jadi IP aslinya ada di header `CF-Connecting-IP`. Header itu hanya boleh dipercaya kalau request benar-benar datang dari server Cloudflare. Kalau tidak dibatasi, orang yang menembak IP server langsung bisa memalsukan IP-nya.

Buat daftar IP Cloudflare untuk Nginx:

```bash
{ curl -fsS https://www.cloudflare.com/ips-v4; echo; curl -fsS https://www.cloudflare.com/ips-v6; } | grep -E '^[0-9a-f]' | sed 's/.*/set_real_ip_from &;/' > /www/server/nginx/conf/cloudflare-realip.conf && echo 'real_ip_header CF-Connecting-IP;' >> /www/server/nginx/conf/cloudflare-realip.conf && wc -l /www/server/nginx/conf/cloudflare-realip.conf
```

Pasang ke config situs, tambahkan `X-Forwarded-Proto`, lalu muat ulang Nginx. Perintah ini aman diulang dan membuat cadangan `.bak` dulu:

```bash
F=/www/server/panel/vhost/nginx/bynana.my.id.conf; cp $F $F.bak; grep -q "cloudflare-realip.conf" $F || sed -i '0,/server_name.*;/s##&\n    include /www/server/nginx/conf/cloudflare-realip.conf;#' $F; grep -q "X-Forwarded-Proto" $F || sed -i 's#^\(\s*\)proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;#&\n\1proxy_set_header X-Forwarded-Proto $scheme;#' $F; grep -q "X-Real-IP" $F || sed -i 's#^\(\s*\)proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;#&\n\1proxy_set_header X-Real-IP $remote_addr;#' $F; nginx -t && nginx -s reload && grep -n "proxy_pass\|cloudflare-realip\|X-Real-IP\|Forwarded" $F
```

Hasilnya harus menampilkan `proxy_pass http://127.0.0.1:3200`, baris `include .../cloudflare-realip.conf`, `X-Real-IP`, dan `X-Forwarded-Proto`.

Baris `nginx: [warn] protocol options redefined ...` berasal dari config situs lain dan aman diabaikan. Selama ada tulisan `test is successful`, langkah ini sudah berhasil. **Jangan jalankan perintah di bawah ini.**

Perintah berikut **hanya** untuk kalau muncul `test failed`. Perintah ini mengembalikan cadangan dan membatalkan langkah 10:

```bash
F=/www/server/panel/vhost/nginx/bynana.my.id.conf; cp $F.bak $F && nginx -s reload
```

aaPanel bisa menulis ulang config Nginx saat pengaturan proxy diubah dari panel. Kalau itu terjadi, jalankan lagi perintah di atas.

## 11. Cek dari luar

```bash
curl -sI https://bynana.my.id/ | head -1 && curl -s https://bynana.my.id/robots.txt | head -3
```

Baris pertama harus `HTTP/2 200`. Lalu buka https://bynana.my.id/admin/masuk di HP dan masuk dengan akun dari langkah 7.

Cek juga bahwa port aplikasi tidak terbuka ke internet. Dari komputer lain (bukan VPS), alamat `http://72.61.242.142:3200` harus gagal dibuka. Kalau ternyata terbuka, pastikan `HOST=127.0.0.1` ada di `.env`, lalu restart project `bynana`.

## 12. Backup harian

Di aaPanel, buka **Cron → Add Cron Job**:

| Kolom | Isi |
| --- | --- |
| Type | Shell Script |
| Name | Backup bynana |
| Period | Daily, jam 03:00 |
| Script | `cd /opt/bynana && ./scripts/backup.sh` |

Backup tersimpan di `/www/backup/bynana`, satu file per hari, disimpan 14 hari. Coba sekali sekarang:

```bash
cd /opt/bynana && ./scripts/backup.sh
```

Memulihkan dari backup: hentikan project `bynana` di aaPanel, ekstrak file backup ke `/opt/bynana-data` (menimpa `bynana.sqlite` dan folder `uploads`), jalankan `chown -R www:www /opt/bynana-data`, lalu start lagi.

```bash
tar -xzf /www/backup/bynana/NAMA-FILE.tar.gz -C /opt/bynana-data && chown -R www:www /opt/bynana-data
```

## 13. Update ke versi terbaru

```bash
export PATH=/www/server/nodejs/v24.13.0/bin:$PATH && cd /opt/bynana && ./scripts/deploy.sh
```

Skrip ini mengambil kode terbaru, build di folder terpisah sementara situs tetap jalan, menukar ke build baru, me-restart project `bynana`, lalu mengecek situsnya. Kalau situs tidak hidup, skrip otomatis kembali ke versi sebelumnya.

## Masalah yang mungkin muncul

| Gejala | Penyebab dan cara mengatasi |
| --- | --- |
| Simpan form di admin gagal dengan pesan "Cross-site POST form submissions are forbidden" | `ORIGIN` di `.env` tidak sama persis dengan alamat situs. Isi `ORIGIN=https://bynana.my.id` (tanpa garis miring di akhir), lalu restart project. |
| Upload foto gagal untuk foto besar | `BODY_SIZE_LIMIT` di `.env` harus `15728640` (15 MB). Panel admin sudah mengecilkan foto di HP sebelum diunggah, jadi ini jarang terjadi. |
| Login selalu ditolak "Terlalu banyak percobaan" dari semua HP | IP pengunjung tidak terbaca dan semua orang dianggap satu IP. Jalankan lagi langkah 10. |
| Situs 502 Bad Gateway | Project `bynana` mati. Buka **Website → Node Project**, klik **Start** atau lihat **Log**. |
| Lupa password admin | `cd /opt/bynana && npm run admin -- reset`, lalu ketik password baru. |
| Halaman Cloudflare "Error 526" | Sertifikat di aaPanel belum dipasang atau mode SSL bukan Full (strict). Ulangi langkah 3 dan 9. |
