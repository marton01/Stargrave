// defineConfig comes from vitest/config rather than vite, so that the `test`
// section is typed as well.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Where the site lives, as a url path. Locally that is the root; on GitHub
  // Pages a project site lives under `/<repo>/`, and every url in the build has
  // to know that. Nothing in the source hard-codes a path — `index.html` is
  // rewritten at build time and the optional assets go through
  // `import.meta.env.BASE_URL` (see ui/assets.ts) — so this one value is the
  // whole of it. The deploy workflow sets it; see .github/workflows/pages.yml.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // The bundle goes to `bundle/`, not the default `assets/`, because
    // `public/assets` is copied to the build root as well — and two different
    // things called "assets" in one folder is a trap waiting for the day
    // somebody drops in a file whose name happens to collide.
    assetsDir: 'bundle',
  },
  test: {
    // The engine tests play tens of thousands of rounds; the 5 s default is far
    // too tight for that, and a timeout there would only ever be a false alarm.
    testTimeout: 60_000,
  },
})
