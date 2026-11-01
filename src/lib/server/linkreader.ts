import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { request } from 'node:https';
import { isIP } from 'node:net';
import { isStoreHost, nameFromUrl } from './stores.ts';

export const USER_AGENT = 'bynana-link-reader/1.0 (+https://bynana.my.id)';
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 5000;

export interface Hop {
	status: number;
	location: string | null;
}

/** Satu permintaan HTTP tanpa mengikuti redirect. Bisa diganti di tes. */
export type Requester = (url: string, signal: AbortSignal) => Promise<Hop>;

export interface ResolveResult {
	finalUrl: string;
	name: string | null;
}

export class LinkReadError extends Error {}

/** Alamat IPv4/IPv6 yang tidak boleh dihubungi dari server (lokal, privat, link-local, dan sejenisnya). */
export function isPrivateAddress(ip: string): boolean {
	const v = isIP(ip);
	if (v === 4) {
		const [a, b] = ip.split('.').map(Number);
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			(a === 192 && b === 0) ||
			(a === 198 && (b === 18 || b === 19)) ||
			a >= 224
		);
	}
	if (v === 6) {
		const x = ip.toLowerCase();
		if (x === '::' || x === '::1') return true;
		const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
		if (mapped) return isPrivateAddress(mapped[1]);
		return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(x) || x.startsWith('64:ff9b:') || x.startsWith('2001:db8');
	}
	return true;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** DNS lookup yang menolak alamat privat, supaya nama host tidak bisa diarahkan ke jaringan dalam. */
function safeLookup(hostname: string, options: object, callback: LookupCallback): void {
	dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
		if (err) return callback(err, []);
		const list = addresses as LookupAddress[];
		if (!list.length || list.some((a) => isPrivateAddress(a.address))) {
			const e = new Error('Alamat tujuan tidak diizinkan') as NodeJS.ErrnoException;
			e.code = 'EPRIVATE';
			return callback(e, []);
		}
		const wantAll = (options as { all?: boolean }).all;
		if (wantAll) return callback(null, list);
		callback(null, list[0].address, list[0].family);
	});
}

export const httpsRequester: Requester = (url, signal) =>
	new Promise((resolve, reject) => {
		const req = request(
			url,
			{
				method: 'GET',
				headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
				lookup: safeLookup as never,
				signal
			},
			(res) => {
				const location = typeof res.headers.location === 'string' ? res.headers.location : null;
				resolve({ status: res.statusCode ?? 0, location });
				res.destroy();
			}
		);
		req.on('error', reject);
		req.end();
	});

function checkUrl(raw: string): URL {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		throw new LinkReadError('Alamat tidak valid');
	}
	if (u.protocol !== 'https:') throw new LinkReadError('Hanya alamat https yang dibaca');
	if (u.username || u.password) throw new LinkReadError('Alamat tidak valid');
	if (u.port && u.port !== '443') throw new LinkReadError('Port tidak diizinkan');
	if (isIP(u.hostname.replace(/^\[|\]$/g, ''))) throw new LinkReadError('Alamat IP tidak diizinkan');
	if (!isStoreHost(u.hostname)) throw new LinkReadError('Bukan alamat toko yang dikenal');
	return u;
}

/**
 * Mengikuti redirect link pendek toko sampai alamat produk asli, lalu membaca nama dari alamat itu.
 * Hanya host toko yang dikenal, maksimal 5 redirect, batas waktu 5 detik.
 */
export async function resolveLink(url: string, requester: Requester = httpsRequester): Promise<ResolveResult> {
	let current = checkUrl(url);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		for (let i = 0; i <= MAX_REDIRECTS; i++) {
			const direct = nameFromUrl(current.toString());
			if (direct) return { finalUrl: current.toString(), name: direct };
			let hop: Hop;
			try {
				hop = await requester(current.toString(), controller.signal);
			} catch (err) {
				if (controller.signal.aborted) throw new LinkReadError('Toko terlalu lama menjawab');
				throw new LinkReadError('Link tidak bisa dibuka');
			}
			if (hop.status >= 300 && hop.status < 400 && hop.location) {
				if (i === MAX_REDIRECTS) throw new LinkReadError('Terlalu banyak pengalihan');
				current = checkUrl(new URL(hop.location, current).toString());
				continue;
			}
			return { finalUrl: current.toString(), name: nameFromUrl(current.toString()) };
		}
		throw new LinkReadError('Terlalu banyak pengalihan');
	} finally {
		clearTimeout(timer);
	}
}
