/**
 * Sambungan ke Shopee Affiliate Open API (GraphQL).
 * Dipakai hanya kalau SHOPEE_AFFILIATE_APP_ID dan SHOPEE_AFFILIATE_SECRET diisi di .env server.
 *
 * Tanda tangan permintaan mengikuti dokumentasi Open API:
 *   Authorization: SHA256 Credential={AppId}, Timestamp={Timestamp}, Signature={SHA256(AppId + Timestamp + Payload + Secret)}
 * Payload adalah isi body JSON persis seperti yang dikirim.
 */
import { createHash } from 'node:crypto';
import { request } from 'node:https';
import { safeLookup, USER_AGENT } from './linkreader.ts';

const DEFAULT_ENDPOINT = 'https://open-api.affiliate.shopee.co.id/graphql';
const TIMEOUT_MS = 8000;
const MAX_RESPONSE = 512 * 1024;

export class ShopeeApiError extends Error {}

export interface ShopeeConfig {
	appId: string;
	secret: string;
	endpoint: string;
}

export interface ShopeeIds {
	shopId: string;
	itemId: string;
}

export interface ShopeeOffer {
	name: string | null;
	price: number | null;
	imageUrl: string | null;
	offerLink: string | null;
}

/** Konfigurasi dari .env. Null kalau belum diisi, jadi fitur ini otomatis mati. */
export function shopeeConfig(env: Record<string, string | undefined> = process.env): ShopeeConfig | null {
	const appId = (env.SHOPEE_AFFILIATE_APP_ID ?? '').trim();
	const secret = (env.SHOPEE_AFFILIATE_SECRET ?? '').trim();
	if (!appId || !secret) return null;
	const endpoint = (env.SHOPEE_AFFILIATE_ENDPOINT ?? '').trim() || DEFAULT_ENDPOINT;
	const u = new URL(endpoint);
	if (u.protocol !== 'https:' || !(u.hostname === 'shopee.co.id' || u.hostname.endsWith('.shopee.co.id'))) {
		throw new ShopeeApiError('SHOPEE_AFFILIATE_ENDPOINT harus alamat https di shopee.co.id');
	}
	return { appId, secret, endpoint: u.toString() };
}

/** ID toko dan ID produk dari alamat produk Shopee lengkap. */
export function parseShopeeIds(url: string): ShopeeIds | null {
	let u: URL;
	try {
		u = new URL(url);
	} catch {
		return null;
	}
	const host = u.hostname.toLowerCase();
	if (!(host === 'shopee.co.id' || host.endsWith('.shopee.co.id'))) return null;
	const path = decodeURIComponent(u.pathname);
	const patterns = [/^\/product\/(\d{1,15})\/(\d{1,20})\/?$/, /^\/universal-link\/product\/(\d{1,15})\/(\d{1,20})\/?$/, /-i\.(\d{1,15})\.(\d{1,20})\/?$/];
	for (const p of patterns) {
		const m = path.match(p);
		if (m) return { shopId: m[1], itemId: m[2] };
	}
	return null;
}

export function signature(appId: string, timestamp: number, payload: string, secret: string): string {
	return createHash('sha256').update(`${appId}${timestamp}${payload}${secret}`).digest('hex');
}

export type Poster = (url: string, headers: Record<string, string>, body: string, signal: AbortSignal) => Promise<{ status: number; text: string }>;

export const httpsPoster: Poster = (url, headers, body, signal) =>
	new Promise((resolve, reject) => {
		const req = request(url, { method: 'POST', headers, lookup: safeLookup as never, signal }, (res) => {
			const chunks: Buffer[] = [];
			let size = 0;
			res.on('data', (c: Buffer) => {
				size += c.length;
				if (size > MAX_RESPONSE) {
					req.destroy(new Error('Jawaban terlalu besar'));
					return;
				}
				chunks.push(c);
			});
			res.on('end', () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString('utf8') }));
			res.on('error', reject);
		});
		req.on('error', reject);
		req.end(body);
	});

function toPrice(v: unknown): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function str(v: unknown): string | null {
	return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Data produk dari Open API. Null kalau produk tidak ditemukan. Melempar ShopeeApiError kalau API menolak. */
export async function fetchShopeeOffer(
	ids: ShopeeIds,
	opts: { config?: ShopeeConfig | null; poster?: Poster; now?: () => number } = {}
): Promise<ShopeeOffer | null> {
	const config = opts.config === undefined ? shopeeConfig() : opts.config;
	if (!config) return null;
	if (!/^\d+$/.test(ids.shopId) || !/^\d+$/.test(ids.itemId)) return null;
	const query = `{ productOfferV2(shopId: ${ids.shopId}, itemId: ${ids.itemId}, limit: 1) { nodes { itemId shopId productName imageUrl priceMin priceMax offerLink productLink } } }`;
	const body = JSON.stringify({ query });
	const timestamp = Math.floor((opts.now ?? Date.now)() / 1000);
	const headers = {
		'Content-Type': 'application/json',
		'User-Agent': USER_AGENT,
		Authorization: `SHA256 Credential=${config.appId}, Timestamp=${timestamp}, Signature=${signature(config.appId, timestamp, body, config.secret)}`
	};
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let res: { status: number; text: string };
	try {
		res = await (opts.poster ?? httpsPoster)(config.endpoint, headers, body, controller.signal);
	} catch {
		throw new ShopeeApiError(controller.signal.aborted ? 'Shopee terlalu lama menjawab' : 'Shopee Open API tidak bisa dihubungi');
	} finally {
		clearTimeout(timer);
	}
	let data: { data?: { productOfferV2?: { nodes?: Record<string, unknown>[] } }; errors?: { message?: string }[] };
	try {
		data = JSON.parse(res.text);
	} catch {
		throw new ShopeeApiError(`Jawaban Shopee tidak terbaca (status ${res.status})`);
	}
	if (data.errors?.length) throw new ShopeeApiError(`Shopee menolak: ${data.errors[0].message ?? 'tanpa keterangan'}`);
	if (res.status >= 400) throw new ShopeeApiError(`Shopee menolak (status ${res.status})`);
	const node = data.data?.productOfferV2?.nodes?.[0];
	if (!node) return null;
	const imageUrl = str(node.imageUrl);
	return {
		name: str(node.productName)?.slice(0, 160) ?? null,
		price: toPrice(node.priceMin ?? node.priceMax),
		imageUrl: imageUrl && imageUrl.startsWith('https://') ? imageUrl : null,
		offerLink: str(node.offerLink)
	};
}
