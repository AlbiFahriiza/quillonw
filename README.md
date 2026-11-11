# Quillon

Quillon is a programmable video studio — where code becomes cinema.
Write code, edit programmatically, render cinema.

Status: coming soon.

Live page: https://albifahriiza.github.io/quillonw/

## Stack

- Next.js (App Router) with TypeScript
- Tailwind CSS
- GSAP with @gsap/react
- Static export, published to GitHub Pages

## Develop

```bash
npm install
npm run dev
```

The dev server runs at http://localhost:3000.

## Build

Production deploys serve the site under `/quillonw` on GitHub Pages, so the
build reads `NEXT_PUBLIC_BASE_PATH` and `NEXT_PUBLIC_SITE_URL` (both set in
`.github/workflows/deploy.yml`). To reproduce the production build locally:

```bash
NEXT_PUBLIC_BASE_PATH=/quillonw NEXT_PUBLIC_SITE_URL=https://albifahriiza.github.io/quillonw npm run build
```

The static export lands in `out/`. Serve it from any static file server.

## Deploy

Pushes to `main` trigger the workflow in `.github/workflows/deploy.yml`,
which builds the export and publishes it to GitHub Pages. It can also be
run manually from the Actions tab.
