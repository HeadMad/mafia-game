import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// GitHub Pages project site: /mafia-game/
const base = process.env.BASE_PATH || '/mafia-game/';

export default defineConfig({
	base,
	plugins: [
		svelte({
			compilerOptions: {
				runes: true
			}
		}),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
			manifest: {
				name: 'Байкальская Мафия',
				short_name: 'Мафия',
				description: 'Приложение ведущего для игры Байкальская Мафия',
				theme_color: '#f5f5f7',
				background_color: '#f5f5f7',
				display: 'standalone',
				orientation: 'portrait',
				start_url: base,
				scope: base,
				lang: 'ru',
				icons: [
					{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
				navigateFallback: 'index.html'
			},
			devOptions: {
				enabled: false
			}
		})
	],
	resolve: {
		alias: {
			$lib: path.resolve('src/lib'),
			$components: path.resolve('src/lib/components'),
			$state: path.resolve('src/lib/state'),
			$js: path.resolve('src/lib/js')
		}
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true
	}
});
