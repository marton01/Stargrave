// defineConfig comes from vitest/config rather than vite, so that the `test`
// section is typed as well.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

/**
 * Which build this is, stamped in at build time.
 *
 * There is one question that comes up every time something is wrong with a
 * deployed copy of anything — "are you actually running the fix?" — and without
 * this it cannot be answered. A player reporting a bug can read a version off
 * the screen; a stale `index.html` sitting in somebody's cache announces itself
 * as an old date instead of hiding behind a bundle filename nobody can decode.
 *
 * `git` may not be there at all (a tarball, a CI checkout without history), and
 * a missing version must never fail a build.
 */
function buildStamp(): { commit: string; at: string } {
  let commit = 'dev'
  try {
    commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    const dirty = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    if (dirty) commit += '+'
  } catch {
    // No git here. The date alone still answers the question that matters.
  }
  return { commit, at: new Date().toISOString().slice(0, 16).replace('T', ' ') }
}

export default defineConfig({
  define: {
    __BUILD__: JSON.stringify(buildStamp()),
  },
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
