/** Mengecilkan foto di HP sebelum diunggah supaya hemat kuota. Kalau gagal, file asli yang dipakai. */
export async function shrinkPhoto(file: File, max = 1600): Promise<File> {
	if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 400 * 1024) return file;
	try {
		const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
		const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
		if (!blob || blob.size >= file.size) return file;
		return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
	} catch {
		return file;
	}
}
