export type ParsedQuery = { number: number } | { text: string } | null;

/** "459", "no.459", "No 459", "#459", "nomor 459" menjadi nomor. Selain itu dicari sebagai teks. */
export function parseQuery(raw: string | null | undefined): ParsedQuery {
	const q = (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
	if (!q) return null;
	const m = q.match(/^(?:no\.?|nomor|nmr|#)?\s*(\d{1,6})$/i);
	if (m) {
		const n = Number(m[1]);
		if (n > 0) return { number: n };
	}
	return { text: q };
}
