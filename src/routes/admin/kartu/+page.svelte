<script lang="ts">
	import { enhance } from '$app/forms';
	import { accountText, imageSrc, PLATFORM_NAMES } from '$lib/format';
	let { data, form } = $props();

	const KIND = { promo: 'Promo', link: 'Link', video: 'Video', teks: 'Teks' } as const;
	const KIND_HELP = {
		promo: 'Ajak pengunjung ke kategori atau link tertentu, misalnya kumpulan diskon.',
		link: 'Tombol ke alamat lain, misalnya etalase toko.',
		video: 'Gambar sampul dan tombol ke video TikTok, Reels, atau YouTube.',
		teks: 'Pengumuman singkat tanpa tombol.'
	} as const;
	interface CardValues {
		id: number;
		kind: string;
		title: string;
		body: string;
		buttonLabel: string;
		url: string;
		categoryId: number | null;
		image: string | null;
		visible: boolean;
		startsAt: string | null;
		endsAt: string | null;
	}
	const empty: CardValues = { id: 0, kind: 'promo', title: '', body: '', buttonLabel: '', url: '', categoryId: null, image: null, visible: true, startsAt: null, endsAt: null };
	let openNew = $state(false);
	let openAccount = $state(false);
</script>

<svelte:head><title>Kartu · admin bynana</title></svelte:head>

{#snippet cardForm(c: CardValues)}
	<form method="post" action="?/simpanKartu" enctype="multipart/form-data" class="stack" use:enhance>
		<input type="hidden" name="id" value={c.id} />
		{#if form && 'cardError' in form && form.cardId === c.id}<p class="notice error" role="alert">{form.cardError}</p>{/if}
		<div class="field">
			<label for="kind-{c.id}">Jenis</label>
			<select id="kind-{c.id}" name="kind">
				{#each data.kinds as k (k)}<option value={k} selected={c.kind === k}>{KIND[k]}: {KIND_HELP[k]}</option>{/each}
			</select>
		</div>
		<div class="field">
			<label for="title-{c.id}">Judul</label>
			<input id="title-{c.id}" name="title" maxlength="80" required value={c.title} />
		</div>
		<div class="field">
			<label for="body-{c.id}">Teks (boleh kosong)</label>
			<textarea id="body-{c.id}" name="body" rows="2" maxlength="280">{c.body}</textarea>
		</div>
		<div class="row2">
			<div class="field">
				<label for="cat-{c.id}">Buka kategori</label>
				<select id="cat-{c.id}" name="category">
					<option value="">Tidak</option>
					{#each data.categories as k (k.id)}<option value={k.id} selected={c.categoryId === k.id}>{k.name}</option>{/each}
				</select>
			</div>
			<div class="field">
				<label for="btn-{c.id}">Tulisan tombol</label>
				<input id="btn-{c.id}" name="button_label" maxlength="40" placeholder="Lihat" value={c.buttonLabel} />
			</div>
		</div>
		<div class="field">
			<label for="url-{c.id}">Atau link tujuan</label>
			<input id="url-{c.id}" name="url" type="url" inputmode="url" placeholder="https://" value={c.url} />
			<p class="help">Kalau kategori dipilih, tombol membuka kategori itu dan link ini tidak dipakai.</p>
		</div>
		<div class="field">
			<label for="img-{c.id}">Gambar (boleh kosong)</label>
			{#if c.image}<img class="thumb" src={imageSrc(c.image, 400)} alt="" width="56" height="56" />{/if}
			<input id="img-{c.id}" name="gambar" type="file" accept="image/*" />
			{#if c.image}<label class="check"><input type="checkbox" name="hapus_gambar" value="1" /> Hapus gambar</label>{/if}
		</div>
		<div class="row2">
			<div class="field">
				<label for="start-{c.id}">Tampil mulai</label>
				<input id="start-{c.id}" name="starts_at" type="date" value={c.startsAt ?? ''} />
			</div>
			<div class="field">
				<label for="end-{c.id}">Sampai</label>
				<input id="end-{c.id}" name="ends_at" type="date" value={c.endsAt ?? ''} />
			</div>
		</div>
		<label class="check"><input type="checkbox" name="visible" value="1" checked={c.visible} /> Tampilkan di situs</label>
		<button class="btn primary">Simpan kartu</button>
	</form>
{/snippet}

<main class="admin-wrap">
	<h1>Kartu</h1>
	<p class="muted">Kartu tampil di atas katalog. Di tema Kartu pastel, kartu bisa digeser.</p>
	{#if form && 'ok' in form && form.ok}<p class="notice" role="status">{form.ok}</p>{/if}

	<ul class="list">
		{#each data.cards as c, i (c.id)}
			<li class="panel">
				<details>
					<summary>
						<span class="status {c.visible ? 'published' : 'archived'}">{KIND[c.kind]}{c.visible ? '' : ', disembunyikan'}</span>
						<strong>{c.title}</strong>
					</summary>
					<div class="inner">
						{@render cardForm(c)}
						<div class="mini-actions">
							{#if i > 0}<form method="post" action="?/geserKartu" use:enhance><input type="hidden" name="id" value={c.id} /><input type="hidden" name="arah" value="naik" /><button class="btn small">Naikkan</button></form>{/if}
							{#if i < data.cards.length - 1}<form method="post" action="?/geserKartu" use:enhance><input type="hidden" name="id" value={c.id} /><input type="hidden" name="arah" value="turun" /><button class="btn small">Turunkan</button></form>{/if}
							<form method="post" action="?/hapusKartu" use:enhance><input type="hidden" name="id" value={c.id} /><button class="btn small danger">Hapus</button></form>
						</div>
					</div>
				</details>
			</li>
		{/each}
	</ul>
	{#if !data.cards.length}<p class="panel">Belum ada kartu. Kartu promo cocok untuk diskon tanggal kembar.</p>{/if}

	<details class="panel add" bind:open={openNew}>
		<summary><strong>Tambah kartu</strong></summary>
		<div class="inner">{@render cardForm(empty)}</div>
	</details>

	<h2>Akun sosmed</h2>
	<p class="muted">Tampil sebagai tombol di bagian profil. Satu platform boleh lebih dari satu akun.</p>
	<ul class="list">
		{#each data.accounts as a, i (a.id)}
			<li class="panel">
				<details>
					<summary><strong>{accountText(a.platform, a.label)}</strong>{#if !a.visible}<span class="muted"> · disembunyikan</span>{/if}</summary>
					<div class="inner">
						<form method="post" action="?/simpanAkun" class="stack" use:enhance>
							<input type="hidden" name="id" value={a.id} />
							{#if form && 'accountError' in form && form.accountId === a.id}<p class="notice error" role="alert">{form.accountError}</p>{/if}
							<div class="row2">
								<div class="field">
									<label for="pf-{a.id}">Platform</label>
									<select id="pf-{a.id}" name="platform">
										{#each data.platforms as p (p)}<option value={p} selected={a.platform === p}>{PLATFORM_NAMES[p] || 'Lainnya'}</option>{/each}
									</select>
								</div>
								<div class="field">
									<label for="lb-{a.id}">Nama akun</label>
									<input id="lb-{a.id}" name="label" maxlength="40" value={a.label} />
								</div>
							</div>
							<div class="field">
								<label for="au-{a.id}">Link</label>
								<input id="au-{a.id}" name="url" type="url" inputmode="url" required value={a.url} />
							</div>
							<label class="check"><input type="checkbox" name="visible" value="1" checked={a.visible} /> Tampilkan</label>
							<button class="btn primary">Simpan akun</button>
						</form>
						<div class="mini-actions">
							{#if i > 0}<form method="post" action="?/geserAkun" use:enhance><input type="hidden" name="id" value={a.id} /><input type="hidden" name="arah" value="naik" /><button class="btn small">Naikkan</button></form>{/if}
							{#if i < data.accounts.length - 1}<form method="post" action="?/geserAkun" use:enhance><input type="hidden" name="id" value={a.id} /><input type="hidden" name="arah" value="turun" /><button class="btn small">Turunkan</button></form>{/if}
							<form method="post" action="?/hapusAkun" use:enhance><input type="hidden" name="id" value={a.id} /><button class="btn small danger">Hapus</button></form>
						</div>
					</div>
				</details>
			</li>
		{/each}
	</ul>

	<details class="panel add" bind:open={openAccount}>
		<summary><strong>Tambah akun</strong></summary>
		<div class="inner">
			<form method="post" action="?/simpanAkun" class="stack" use:enhance>
				{#if form && 'accountError' in form && !form.accountId}<p class="notice error" role="alert">{form.accountError}</p>{/if}
				<div class="row2">
					<div class="field">
						<label for="pf-new">Platform</label>
						<select id="pf-new" name="platform">
							{#each data.platforms as p (p)}<option value={p}>{PLATFORM_NAMES[p] || 'Lainnya'}</option>{/each}
						</select>
					</div>
					<div class="field">
						<label for="lb-new">Nama akun</label>
						<input id="lb-new" name="label" maxlength="40" placeholder="@bynana" />
					</div>
				</div>
				<div class="field">
					<label for="au-new">Link</label>
					<input id="au-new" name="url" type="url" inputmode="url" required placeholder="https://www.tiktok.com/@..." />
				</div>
				<input type="hidden" name="visible" value="1" />
				<button class="btn primary">Tambah akun</button>
			</form>
		</div>
	</details>
</main>

<style>
	summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.inner {
		padding-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.add {
		margin-top: 12px;
	}
	.mini-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.help {
		margin: 0;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
	}
	.check input {
		width: 20px;
		height: 20px;
	}
</style>
