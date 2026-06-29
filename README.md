# Sketch Is More

Static website for Ravindra Verma's coffee-table book, _Sketch Is More / Coffee with an Architect_.

## What This Site Contains

- `index.html`: a short authored walk through selected pages from the book.
- `reader.html`: full page-by-page reader with preserved physical spreads.
- `sitemap.xml`, `robots.txt`, `site.webmanifest`, `sw.js`: generated discovery/PWA files.

## Build

Use a real deployed origin when building for production so sitemap, robots, and structured-data URLs are correct:

```sh
SITE_ORIGIN=https://example.com npm run build
```

For this repository's GitHub Pages deployment, use:

```sh
SITE_ORIGIN=https://rhnvrm.github.io/sketch-is-more npm run build
```

Optional:

```sh
SITEMAP_LASTMOD=2026-06-27 SITE_ORIGIN=https://example.com npm run build
```

For local development:

```sh
npm run build
python3 -m http.server 8000
```

## Verification

Fast static release checks:

```sh
npm run verify:release
```

Production share URL check, after building with the real public origin:

```sh
SITE_ORIGIN=https://example.com npm run build
npm run verify:public
```

Responsive/browser audit, using the running Chromium DevTools endpoint:

```sh
npm run audit:site
```

Offline repeat-visit audit, after the local site is running:

```sh
npm run audit:offline
```

The audit expects the local site at `http://127.0.0.1:8000` and Chrome/Chromium remote debugging at `http://127.0.0.1:9229/json/list` by default. Override with:

```sh
SITE_URL=http://127.0.0.1:8000 CDP_LIST_URL=http://127.0.0.1:9229/json/list npm run audit:site
```

## Deployment Checklist

1. Set `SITE_ORIGIN` to the final public origin.
2. Run `npm run build`.
3. Run `npm run verify:release`.
4. Run `npm run verify:public` to catch accidental localhost canonical, Open Graph, Twitter, sitemap, or robots URLs.
5. Run `npm run audit:site` against the built site.
6. Run `npm run audit:offline` to verify service-worker repeat visits.
7. GitHub Actions deploys the generated static files to GitHub Pages from `.github/workflows/deploy-pages.yml`.

Do not hand-edit generated root HTML files. Edit `src/pages/*.html`, `book-data.js`, scripts, CSS, or `scripts/render-site.mjs`, then rebuild.
