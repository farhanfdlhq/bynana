/** Notifikasi kecil di atas menu bawah, pengganti alert bawaan browser. */
export interface Toast {
	id: number;
	text: string;
	kind: 'ok' | 'error';
}

export const toasts = $state<Toast[]>([]);
let next = 1;

export function toast(text: string, kind: Toast['kind'] = 'ok', ms = 4000): void {
	// Pesan yang sama tidak ditumpuk kalau halaman memuat ulang datanya beberapa kali.
	if (toasts.some((t) => t.text === text)) return;
	const id = next++;
	toasts.push({ id, text, kind });
	if (toasts.length > 3) toasts.shift();
	setTimeout(() => dismiss(id), ms);
}

export function dismiss(id: number): void {
	const i = toasts.findIndex((t) => t.id === id);
	if (i >= 0) toasts.splice(i, 1);
}
