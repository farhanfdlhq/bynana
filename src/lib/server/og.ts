import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';
import { dataDir } from './db.ts';
import { uploadsDir } from './images.ts';
import type { Theme } from './settings.ts';

const COLORS: Record<Theme, { bg: string; ink: string; tile: string }> = {
	blok: { bg: '#FF4F9A', ink: '#141414', tile: '#FFD3E6' },
	pastel: { bg: '#FFC2D6', ink: '#2A0F1F', tile: '#FFF0F4' }
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text: string, max: number, lines: number): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	const out: string[] = [];
	let line = '';
	for (const w of words) {
		const next = line ? `${line} ${w}` : w;
		if (next.length > max && line) {
			out.push(line);
			line = w;
			if (out.length === lines) break;
		} else line = next;
	}
	if (out.length < lines && line) out.push(line);
	if (out.length === lines && words.join(' ').length > out.join(' ').length) out[lines - 1] = out[lines - 1].replace(/\s*\S*$/, '') + '…';
	return out;
}

/** Gambar pratinjau 1200×630 untuk WhatsApp, Facebook, dan lainnya. Disimpan supaya tidak dibuat ulang setiap kali. */
export async function productOgImage(p: { number: number; name: string; image: string | null }, theme: Theme, siteName: string): Promise<Buffer> {
	const key = createHash('sha1').update(JSON.stringify([p.number, p.name, p.image, theme, siteName, 2])).digest('hex').slice(0, 16);
	const dir = join(dataDir(), 'og');
	const file = join(dir, `${p.number}-${key}.png`);
	if (existsSync(file)) return readFileSync(file);

	const c = COLORS[theme];
	const lines = wrap(p.name, 22, 3);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${c.bg}"/>
  <rect x="40" y="40" width="550" height="550" rx="44" fill="${c.tile}"/>
  <rect x="640" y="56" width="${120 + String(p.number).length * 52}" height="112" rx="56" fill="${c.ink}"/>
  <text x="${700}" y="136" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="80" fill="${c.bg}">${p.number}</text>
  ${lines.map((l, i) => `<text x="640" y="${270 + i * 66}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="54" fill="${c.ink}">${esc(l)}</text>`).join('\n  ')}
  <text x="640" y="560" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="44" fill="${c.ink}">${esc(siteName)}</text>
</svg>`;

	const layers: OverlayOptions[] = [];
	if (p.image && /^[a-f0-9]{16}$/.test(p.image)) {
		try {
			const photo = await sharp(join(uploadsDir(), `${p.image}.webp`))
				.resize(550, 550, { fit: 'cover' })
				.composite([{ input: Buffer.from('<svg width="550" height="550"><rect width="550" height="550" rx="44" fill="#fff"/></svg>'), blend: 'dest-in' }])
				.png()
				.toBuffer();
			layers.push({ input: photo, left: 40, top: 40 });
		} catch {
			/* foto hilang: kotak warna tetap tampil */
		}
	}
	const png = await sharp(Buffer.from(svg)).composite(layers).png({ compressionLevel: 9 }).toBuffer();
	mkdirSync(dir, { recursive: true });
	writeFileSync(file, png);
	return png;
}
