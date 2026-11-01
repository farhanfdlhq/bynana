import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { uploadsDir } from '$lib/server/images';
import type { RequestHandler } from './$types';

const FILE = /^[a-f0-9]{16}(?:-400)?\.webp$/;

export const GET: RequestHandler = async ({ params }) => {
	if (!FILE.test(params.file)) throw error(404, { message: 'Gambar tidak ditemukan' });
	try {
		const body = await readFile(join(uploadsDir(), params.file));
		return new Response(new Uint8Array(body), {
			headers: {
				'Content-Type': 'image/webp',
				'Cache-Control': 'public, max-age=31536000, immutable',
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch {
		throw error(404, { message: 'Gambar tidak ditemukan' });
	}
};
