# Aturan kerja untuk bynana

Situs link affiliate satu pemilik (bynana.my.id). Pengguna dan pemiliknya hampir selalu memakai HP.

## Desain

- **Mobile dulu.** Setiap layar dirancang dan dicek di lebar 390 px sebelum lebar lain. Tablet dan desktop menyusul.
- Pakai skill **anti-slop** (antislop-ui, antislop-layoutmobile, antislop-copywriting) bersama **style-ui** dan **taste-skill** untuk semua UI dan teks.
- Dua tema publik lengkap: `blok` (Blok warna) dan `pastel` (Kartu pastel). Panel admin memakai warna dan huruf tema aktif. Fitur publik baru harus dibuat untuk kedua tema.
- Jangan pakai tampilan bawaan browser: alert, confirm, upload file, checkbox, radio, dropdown, dan latar autofill. Pakai komponen di `src/lib/admin/`: `Toaster`/`toast`, `ConfirmButton`, `FileInput`, `PasswordInput`, `CardForm`, `ProductForm`.
- Tanpa gradien, emoji, eyebrow, angka karangan, atau semua elemen berbentuk pill.

## Kolom isian

- Label selalu terlihat. Placeholder hanya contoh, bukan pengganti label.
- Pesan error tampil di bawah kolom yang salah (`.field-error`, `aria-describedby`), bukan hanya di atas form.
- Atur `inputmode`, `autocomplete`, `enterkeyhint`, dan `autocapitalize` sesuai isinya. Ukuran huruf minimal 16 px supaya iOS tidak zoom.
- Kolom opsional ditandai "opsional". Bantuan singkat ditaruh di bawah kolom.
- Form admin memakai `novalidate`. Validasi dikerjakan di server dengan pesan bahasa Indonesia.
- Isian yang bisa berubah saat bagian lain form berubah wajib memakai `bind:value`.

## Teks

- Bahasa Indonesia sehari-hari. Di halaman publik memakai "aku".
- Pesan error menyebut apa yang harus dilakukan ("Isi nama produk dulu supaya bisa tayang."), bukan hanya apa yang salah.
- Hindari kata kosong (*solusi terbaik*, *seamless*, *mudah dan cepat*) dan kalimat pasif tanpa pelaku.

## Teknis

- SvelteKit 2 + SQLite. Halaman publik tanpa JavaScript (`csr = false`).
- Sebelum commit: `npm test`, `npm run check`, dan `npm run test:e2e`.
- Kerja di branch `dev`. Jangan merge ke `main` tanpa diminta. Jangan menulis secret di repo.
