/** Mengunduh foto produk dari server gambar toko, lalu menyimpannya seperti foto unggahan biasa. */
import { request } from 'node:https';
import { isIP } from 'node:net';
import { saveImage } from './images.ts';
import { safeLookup, USER_AGENT } from './linkreader.ts';

const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;

/** Host gambar yang boleh diunduh. Subdomain ikut diizinkan. */
const IMAGE_HOSTS = ['susercontent.com', 'shopee.co.id', 'shopeemobile.com'];

export class RemoteImageError extends Error {}

export function isImageHost(host: string): boolean {
	const h = host.toLowerCase();
	return IMAGE_HOSTS.some((base) => h === base || h.endsWith('.' + base));
}

export type Getter = (url: string, signal: AbortSignal) => Promise<{ status: number; location: string | null; body: Buffer }>;

const httpsGetter: Getter = (url, signal) =>
	new Promise((resolve, reject) => {
		const req = request(url, { method: 'GET', headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' }, lookup: safeLookup as never, signal }, (res) => {
			const location = typeof res.headers.location === 'string' ? res.headers.location : null;
			if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400) {
				res.destroy();
				resolve({ status: res.statusCode ?? 0, location, body: Buffer.alloc(0) });
				return;
			}
			const chunks: Buffer[] = [];
			let size = 0;
			res.on('data', (c: Buffer) => {
				size += c.length;
				if (size > MAX_BYTES) {
					req.destroy(new RemoteImageError('Foto dari toko terlalu besar'));
					return;
				}
				chunks.push(c);
			});
			res.on('end', () => resolve({ status: res.statusCode ?? 0, location, body: Buffer.concat(chunks) }));
			res.on('error', reject);
		});
		req.on('error', reject);
		req.end();
	});

function check(raw: string): URL {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		throw new RemoteImageError('Alamat foto tidak valid');
	}
	if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) throw new RemoteImageError('Alamat foto tidak diizinkan');
	if (isIP(u.hostname.replace(/^\[|\]$/g, '')) || !isImageHost(u.hostname)) throw new RemoteImageError('Foto bukan dari server gambar toko');
	return u;
}

/** Mengembalikan nama file foto yang tersimpan (format sama dengan saveImage). */
export async function downloadImage(url: string, getter: Getter = httpsGetter, dir?: string): Promise<string> {
	let current = check(url);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		for (let i = 0; i <= MAX_REDIRECTS; i++) {
			let res;
			try {
				res = await getter(current.toString(), controller.signal);
			} catch (err) {
				if (err instanceof RemoteImageError) throw err;
				throw new RemoteImageError(controller.signal.aborted ? 'Server foto terlalu lama menjawab' : 'Foto tidak bisa diunduh');
			}
			if (res.status >= 300 && res.status < 400 && res.location) {
				current = check(new URL(res.location, current).toString());
				continue;
			}
			if (res.status !== 200 || !res.body.length) throw new RemoteImageError('Foto tidak bisa diunduh');
			return dir ? saveImage(res.body, dir) : saveImage(res.body);
		}
		throw new RemoteImageError('Terlalu banyak pengalihan');
	} finally {
		clearTimeout(timer);
	}
}
