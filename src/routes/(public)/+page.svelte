<script lang="ts">
	import { resolve } from '$app/paths';

	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	const healthUrl = resolve('/api/v1/health');
	const loginUrl = resolve('/login');
</script>

<svelte:head>
	<title>Yukatitip</title>
	<meta
		name="description"
		content="Fondasi awal Yukatitip: SvelteKit, TypeScript strict, Tailwind, Supabase, dan Cloudflare Pages."
	/>
</svelte:head>

<main class="page-shell">
	<section class="hero">
		<div>
			<p class="eyebrow">
				<Badge tone="brand" size="sm">M1</Badge>
				<span>Fondasi project</span>
			</p>
			<h1 class="headline">Yukatitip</h1>
			<p class="lede">
				Web app operasional jasa titip antar-kota. Fondasi SvelteKit, TypeScript strict, Tailwind,
				Supabase, dan Cloudflare Pages sudah siap untuk milestone berikutnya.
			</p>
			<div class="actions">
				<a class="button button-primary" href={healthUrl}>Cek health endpoint</a>
				<a class="button button-secondary" href={loginUrl}>Buka login placeholder</a>
			</div>
			<div class="footer-note" aria-label="Kontrak inti">
				<span>PRD</span>
				<span>AGENTS</span>
				<span>API</span>
				<span>schema</span>
				<span>env</span>
			</div>
		</div>

		<Card as="aside" padding="lg" aria-label="Status fondasi">
			<div class="panel-inner">
				<div>
					<p class="panel-kicker">Status awal</p>
					<h2 class="panel-title">Stack inti sudah hidup.</h2>
					<p class="panel-copy">
						Scaffold ini menaruh struktur kerja yang dibutuhkan sebelum domain bisnis masuk:
						app shell, env contract, Supabase client, hooks session, dan test setup.
					</p>
				</div>

				<ul class="stack-list">
					<li>
						<span>Framework</span>
						<strong>SvelteKit</strong>
					</li>
					<li>
						<span>Bahasa</span>
						<strong>TypeScript strict</strong>
					</li>
					<li>
						<span>UI system</span>
						<strong>Tailwind CSS</strong>
					</li>
					<li>
						<span>Runtime</span>
						<strong>Cloudflare Pages</strong>
					</li>
					<li>
						<span>Database</span>
						<strong>Supabase PostgreSQL</strong>
					</li>
				</ul>
			</div>
		</Card>
	</section>

	<section class="section-grid" aria-label="Ringkasan fondasi">
		<Card as="article">
			<p class="section-kicker">Kontrak</p>
			<h2 class="section-title">Semua aturan produk ada di dokumen sumber kebenaran.</h2>
			<p class="section-copy">
				PRD, AGENTS, API, schema, dan sample data jadi pegangan sebelum fitur bisnis ditulis.
			</p>
		</Card>

		<Card as="article">
			<p class="section-kicker">Tooling</p>
			<h2 class="section-title">Lint, check, test, dan build sudah disiapkan.</h2>
			<p class="section-copy">
				Repo ini sekarang punya skrip verifikasi lokal yang konsisten dengan jalur deploy Cloudflare.
			</p>
		</Card>

		<Card as="article">
			<p class="section-kicker">Langkah lanjut</p>
			<h2 class="section-title">Auth, dashboard internal, dan tracking publik masuk setelah fondasi.</h2>
			<p class="section-copy">
				Milestone berikutnya akan menaruh domain logic di server, bukan memindahkan beban bisnis ke
				browser.
			</p>
		</Card>
	</section>
</main>
