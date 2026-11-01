import { randomBytes } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { dataDir } from './db.ts';

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff']);
export const IMAGE_NAME = /^[a-f0-9]{16}$/;

export class ImageError extends Error {}

export function uploadsDir(): string {
	return join(dataDir(), 'uploads');
}

/** Menyimpan foto sebagai WebP 800 px dan 400 px. Metadata (lokasi, kamera) dibuang. Mengembalikan nama dasar file. */
export async function saveImage(buffer: Buffer, dir = uploadsDir()): Promise<string> {
	if (!buffer.length) throw new ImageError('Foto kosong');
	if (buffer.length > MAX_IMAGE_BYTES) throw new ImageError('Foto terlalu besar. Maksimal 15 MB');
	let format: string | undefined;
	try {
		format = (await sharp(buffer, { limitInputPixels: 60_000_000 }).metadata()).format;
	} catch {
		throw new ImageError('File ini bukan foto yang bisa dibaca. Pakai JPG, PNG, atau WebP');
	}
	if (!format || !ALLOWED.has(format)) throw new ImageError('Format foto tidak didukung. Pakai JPG, PNG, atau WebP');
	mkdirSync(dir, { recursive: true });
	const name = randomBytes(8).toString('hex');
	const base = sharp(buffer, { limitInputPixels: 60_000_000, animated: false }).rotate();
	try {
		await Promise.all([
			base.clone().resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(dir, `${name}.webp`)),
			base.clone().resize(400, 400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 76 }).toFile(join(dir, `${name}-400.webp`))
		]);
	} catch {
		removeImage(name, dir);
		throw new ImageError('Foto gagal diproses. Coba foto lain');
	}
	return name;
}

export function removeImage(name: string | null, dir = uploadsDir()): void {
	if (!name || !IMAGE_NAME.test(name)) return;
	for (const f of [`${name}.webp`, `${name}-400.webp`]) rmSync(join(dir, f), { force: true });
}
