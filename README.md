## Personal Site

Vite multi-page site (3D home + simple home + blog / projects / photos).

### Local

```bash
npm install
npm run dev
```

### GitHub Pages

This repo is built with Vite. **Do not** publish the source tree as Pages — the cooler home needs a production build (`three` + CSS are bundled).

1. Push to `main` (workflow: `.github/workflows/deploy.yml`).
2. Repo **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions** (not “Deploy from a branch”).
3. After the workflow succeeds, the site serves the `dist/` output.
