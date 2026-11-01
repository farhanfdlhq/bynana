<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { imageSrc } from '$lib/format';
	let { data, form } = $props();
	const s = $derived(data.settings);
	let theme = $state(untrack(() => data.settings.theme));
	const msg = (section: string) => (form && 'section' in form && form.section === section ? form : null);
</script>

<svelte:head><title>Atur · admin bynana</title></svelte:head>

{#snippet note(section: string)}
	{@const m = msg(section)}
	{#if m && 'error' in m && m.error}<p class="notice error" role="alert">{m.error}</p>{/if}
	{#if m && 'ok' in m && m.ok}<p class="notice" role="status">{m.ok}</p>{/if}
{/snippet}

<main class="admin-wrap">
	<h1>Atur</h1>

	<section aria-labelledby="h-tema">
		<h2 id="h-tema">Tampilan situs</h2>
		<p class="muted">Pilih satu. Seluruh situs dan panel ini ikut berubah. Produk, nomor, dan link tidak berubah.</p>
		{@render note('tema')}
		<form method="post" action="?/tema" class="stack" use:enhance={() => async ({ update }) => { await update({ reset: false }); location.reload(); }}>
			<fieldset class="themes">
				<legend class="visually-hidden">Tema</legend>
				<label class="theme blok" class:on={theme === 'blok'}>
					<span class="mini" aria-hidden="true">
						<span class="m-head"></span><span class="m-search"></span><span class="m-promo"></span>
						<span class="m-grid"><i></i><i></i><i></i><i></i></span>
					</span>
					<span class="pick"><input type="radio" name="theme" value="blok" bind:group={theme} /> Blok warna</span>
					{#if s.theme === 'blok'}<span class="muted">Sedang dipakai</span>{:else}<a href="/?pratinjau=blok" target="_blank" rel="noopener">Lihat dulu</a>{/if}
				</label>
				<label class="theme pastel" class:on={theme === 'pastel'}>
					<span class="mini" aria-hidden="true">
						<span class="m-deck"><i></i><i></i></span><span class="m-search"></span>
						<span class="m-grid"><i></i><i></i><i></i><i></i></span>
					</span>
					<span class="pick"><input type="radio" name="theme" value="pastel" bind:group={theme} /> Kartu pastel</span>
					{#if s.theme === 'pastel'}<span class="muted">Sedang dipakai</span>{:else}<a href="/?pratinjau=pastel" target="_blank" rel="noopener">Lihat dulu</a>{/if}
				</label>
			</fieldset>
			<button class="btn accent block" disabled={theme === s.theme}>Pakai tema ini</button>
		</form>
	</section>

	<section aria-labelledby="h-profil">
		<h2 id="h-profil">Profil</h2>
		{@render note('profil')}
		<form method="post" action="?/profil" enctype="multipart/form-data" class="stack" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<div class="avatar-row">
				{#if s.avatar}<img class="avatar" src={imageSrc(s.avatar, 400)} alt="Foto profil sekarang" width="72" height="72" />{/if}
				<div class="field grow">
					<label for="avatar">Foto profil</label>
					<input id="avatar" name="avatar" type="file" accept="image/*" />
					{#if s.avatar}<label class="check"><input type="checkbox" name="hapus_avatar" value="1" /> Hapus foto</label>{/if}
				</div>
			</div>
			<div class="field">
				<label for="name">Nama</label>
				<input id="name" name="name" maxlength="40" required value={s.name} />
			</div>
			<div class="field">
				<label for="bio">Kalimat di bawah nama</label>
				<textarea id="bio" name="bio" rows="2" maxlength="200">{s.bio}</textarea>
			</div>
			<button class="btn primary">Simpan profil</button>
		</form>
	</section>

	<section aria-labelledby="h-kategori">
		<h2 id="h-kategori">Kategori</h2>
		{@render note('kategori')}
		<ul class="list">
			{#each data.categories as c, i (c.id)}
				<li class="panel cat">
					<form method="post" action="?/kategoriUbah" class="cat-name" use:enhance={() => async ({ update }) => update({ reset: false })}>
						<input type="hidden" name="id" value={c.id} />
						<label class="visually-hidden" for="cat-{c.id}">Nama kategori</label>
						<input id="cat-{c.id}" name="name" value={c.name} maxlength="40" />
						<button class="btn small">Simpan</button>
					</form>
					<div class="cat-actions">
						<span class="muted">{c.count} produk</span>
						{#if i > 0}<form method="post" action="?/kategoriGeser" use:enhance><input type="hidden" name="id" value={c.id} /><input type="hidden" name="arah" value="naik" /><button class="btn small">Naik</button></form>{/if}
						<form method="post" action="?/kategoriHapus" use:enhance><input type="hidden" name="id" value={c.id} /><button class="btn small danger">Hapus</button></form>
					</div>
				</li>
			{/each}
		</ul>
		<form method="post" action="?/kategoriBaru" class="cat-name new" use:enhance>
			<label class="visually-hidden" for="cat-new">Kategori baru</label>
			<input id="cat-new" name="name" placeholder="Kategori baru, misalnya Skincare" maxlength="40" required />
			<button class="btn primary small">Tambah</button>
		</form>
	</section>

	<section aria-labelledby="h-seo">
		<h2 id="h-seo">Teks di Google dan saat link dibagikan</h2>
		{@render note('seo')}
		<form method="post" action="?/seo" class="stack" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<div class="field">
				<label for="seo_title">Judul</label>
				<input id="seo_title" name="seo_title" maxlength="70" value={s.seoTitle} />
			</div>
			<div class="field">
				<label for="seo_description">Deskripsi singkat</label>
				<textarea id="seo_description" name="seo_description" rows="3" maxlength="170">{s.seoDescription}</textarea>
			</div>
			<button class="btn primary">Simpan teks</button>
		</form>
	</section>

	<section aria-labelledby="h-akun">
		<h2 id="h-akun">Akun admin</h2>
		<p class="muted">Masuk sebagai {data.email}</p>
		{@render note('password')}
		<form method="post" action="?/password" class="stack" use:enhance>
			<input type="email" name="username" autocomplete="username" value={data.email} hidden />
			<div class="field">
				<label for="current">Password sekarang</label>
				<input id="current" name="current" type="password" autocomplete="current-password" required />
			</div>
			<div class="field">
				<label for="next">Password baru (minimal 10 karakter)</label>
				<input id="next" name="next" type="password" autocomplete="new-password" minlength="10" required />
			</div>
			<div class="field">
				<label for="repeat">Ulangi password baru</label>
				<input id="repeat" name="repeat" type="password" autocomplete="new-password" minlength="10" required />
			</div>
			<button class="btn">Ganti password</button>
		</form>
		<form method="post" action="/admin/keluar" class="logout"><button class="btn block">Keluar</button></form>
	</section>
</main>

<style>
	section {
		margin-bottom: 12px;
	}
	.themes {
		border: 0;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.theme {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px 10px 14px;
		border-radius: 24px;
		background: var(--field);
		cursor: pointer;
	}
	:global([data-theme='pastel']) .theme {
		background: #ffffff;
	}
	.theme.on {
		background: var(--ink);
		color: var(--on-ink);
	}
	.theme a {
		font-weight: 600;
		font-size: 14px;
	}
	.theme.on .muted {
		color: var(--on-ink);
	}
	.pick {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 17px;
	}
	.pick input {
		width: 20px;
		height: 20px;
		margin: 0;
	}
	.mini {
		height: 200px;
		border-radius: 16px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.blok .mini {
		background: #ffffff;
	}
	.pastel .mini {
		background: #fff0f4;
		padding: 8px 0 0 8px;
	}
	.m-head {
		height: 58px;
		background: #ff4f9a;
	}
	.m-search {
		height: 12px;
		margin: 0 8px;
		border-radius: 999px;
		background: #f1f1f1;
	}
	.pastel .m-search {
		margin: 0 8px 0 0;
		background: #ffffff;
	}
	.m-promo {
		height: 28px;
		margin: 0 8px;
		border-radius: 10px;
		background: #d7f75b;
	}
	.m-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 5px;
		margin: 0 8px;
	}
	.pastel .m-grid {
		margin: 0 8px 0 0;
	}
	.m-grid i {
		height: 36px;
		border-radius: 8px;
		background: #ffd3e6;
	}
	.pastel .m-grid i:nth-child(2n) {
		background: #bde8d5;
	}
	.blok .m-grid i:nth-child(2n) {
		background: #eef9c4;
	}
	.m-deck {
		display: flex;
		gap: 5px;
	}
	.m-deck i {
		height: 76px;
		width: 72%;
		flex-shrink: 0;
		border-radius: 14px;
		background: #ffc2d6;
	}
	.m-deck i + i {
		width: 30%;
		background: #bde8d5;
	}
	.avatar-row {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 999px;
		object-fit: cover;
	}
	.grow {
		flex: 1;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
	}
	.cat {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.cat-name {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.cat-name.new {
		margin-top: 10px;
	}
	.cat-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}
	.cat-actions .muted {
		margin-right: auto;
	}
	.logout {
		margin-top: 16px;
	}
</style>
