// Which build this is.
//
// The one question that comes up every time a deployed copy misbehaves is
// whether the person is actually running the fix — and it cannot be answered
// from a screenshot unless the screen says so. This exists because a group of
// players spent an evening on a bug that had already been fixed, in a build they
// had not received: the console named the bundle as `index-egno3eYF.js`, which
// tells a developer with the repository in front of them precisely nothing.
//
// It doubles as the cache check. The bundle filename carries a content hash, so
// a browser cannot serve a stale bundle — but it can serve a stale `index.html`,
// which points at the old one. If the date on screen is older than the deploy,
// that is the whole diagnosis: reload harder.

declare const __BUILD__: { commit: string; at: string } | undefined

/** Short commit and build time, or a plain marker when running from source. */
export const BUILD =
  typeof __BUILD__ === 'undefined' ? { commit: 'dev', at: 'fejlesztői' } : __BUILD__

/** One short string for the corner of the screen and for bug reports. */
export function buildLabel(): string {
  return `${BUILD.commit} · ${BUILD.at}`
}
