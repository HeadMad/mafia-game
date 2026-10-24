# Байкальская Мафия

Приложение ведущего для психологической игры «Байкальская Мафия».

**Стек:** Svelte 5 + Vite · PWA · Atomic Architecture · GitHub Pages

## Локально

```bash
npm install
npm run dev
```

## Сборка

```bash
BASE_PATH=/mafia-game/ npm run build
```

Результат в `dist/`.

## GitHub Pages

После пуша в `main` workflow **Build and Deploy** собирает проект и публикует на:

**https://headmad.github.io/mafia-game/**

### Настройка репозитория (один раз)

1. **Settings → Pages**
2. **Source:** `GitHub Actions` (не branch `gh-pages`)
3. Сохранить

После первого успешного деплоя сайт станет доступен по ссылке выше.  
PWA: в Chrome/Safari на телефоне — «На экран Домой».

## PWA

- `manifest.webmanifest` и service worker генерируются `vite-plugin-pwa`
- `registerType: autoUpdate` — новая версия подтягивается при следующем визите
