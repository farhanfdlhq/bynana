import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ImageError, removeImage, saveImage } from '../src/lib/server/images';

describe('gambar', () => {
	it('menyimpan dua ukuran WebP tanpa metadata', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'bynana-img-'));
		const png = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#ff4f9a' } })
			.png()
			.withMetadata({ exif: { IFD0: { Copyright: 'contoh' } } })
			.toBuffer();
		const name = await saveImage(png, dir);
		expect(name).toMatch(/^[a-f0-9]{16}$/);
		const big = await sharp(join(dir, `${name}.webp`)).metadata();
		const small = await sharp(join(dir, `${name}-400.webp`)).metadata();
		expect(big.width).toBe(800);
		expect(small.width).toBe(400);
		expect(big.exif).toBeUndefined();
		removeImage(name, dir);
		expect(existsSync(join(dir, `${name}.webp`))).toBe(false);
	});

	it('menolak file yang bukan gambar', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'bynana-img-'));
		await expect(saveImage(Buffer.from('halo ini teks'), dir)).rejects.toThrow(ImageError);
		await expect(saveImage(Buffer.alloc(0), dir)).rejects.toThrow(ImageError);
	});

	it('menolak file lebih dari 15 MB', async () => {
		await expect(saveImage(Buffer.alloc(16 * 1024 * 1024, 1))).rejects.toThrow('terlalu besar');
	});
});
