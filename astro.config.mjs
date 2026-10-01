import { defineConfig } from 'astro/config';

// Directory format (Astro's default): /articles/ and /articles/<slug>/.
// deploy.sh publishes _build/ to the gh-pages branch.
export default defineConfig({
  site: 'https://evanscarlsonsociety.us',
  outDir: './_build',
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
