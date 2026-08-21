// Optional assets: art and sound that the game works perfectly without.
//
// Everything on screen is drawn from code, and every event is legible from the
// log alone. But if a file happens to be sitting under `public/assets` with the
// right name, it is used. The exact names live in `public/assets/README.md`.
//
// The rule this module exists to enforce: **a missing file is not an error.** No
// throw, no console noise, no layout gap, no broken-image icon.
//
// That last part is why nothing is ever pointed at a url before it is known to
// exist: an `<img>` or an `<audio>` aimed at a missing file makes the browser
// log a 404 to the console, and a console full of red is indistinguishable from
// a broken game. A `fetch(HEAD)` asks the same question quietly. Each answer is
// remembered for the session, so a file that is not there is asked for once.

import { useEffect, useState } from 'react'

/** Sound effects the game knows how to play, if the files are present. */
export type SfxName =
  | 'hit'
  | 'shielded'
  | 'defeated'
  | 'heal'
  | 'rest'
  | 'relic'
  | 'week'
  | 'research'
  | 'puzzleSolved'
  | 'missionWon'
  | 'missionLost'
  | 'ending'

const SOUND_ENABLED_KEY = 'stargrave.sound'

const probes = new Map<string, Promise<boolean>>()
const audioCache = new Map<string, HTMLAudioElement>()

/** Does this asset exist? Asked once per url per session, quietly. */
function probe(url: string): Promise<boolean> {
  const cached = probes.get(url)
  if (cached) return cached
  const request = fetch(url, { method: 'HEAD' })
    .then((response) => {
      // A dev server with an SPA fallback answers 200 with index.html for paths
      // it does not have. That is a miss, not a hit.
      const type = response.headers.get('content-type') ?? ''
      return response.ok && !type.includes('text/html')
    })
    .catch(() => false)
  probes.set(url, request)
  return request
}

/** `public/assets/...` resolved against however the build is served. */
function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`
}

// ------------------------------------------------------------------- images

/**
 * Image formats an optional picture may arrive in, in the order they are tried.
 *
 * `.webp` first because it is the format the asset list asks for and the smaller
 * file, but a downloaded `.png` is not worth a conversion step just to satisfy
 * the code: drop in whichever one you have. Only the extension is flexible —
 * the name before it still has to match the asset list exactly.
 */
const IMAGE_FORMATS = ['webp', 'png'] as const

/** The url of the first format that is actually there for this path, or null. */
async function firstImage(path: string): Promise<string | null> {
  for (const format of IMAGE_FORMATS) {
    const url = assetUrl(`${path}.${format}`)
    if (await probe(url)) return url
  }
  return null
}

/**
 * The url of an optional image, or null while it is unknown or absent.
 *
 * `path` carries no extension — see `IMAGE_FORMATS`.
 *
 * Render it as `{url && <img src={url} .../>}` — see `Portrait.tsx` — so a
 * missing file costs no markup at all. That is the difference between "no
 * portrait" and "a hole where the portrait should be".
 */
export function useOptionalImage(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    setUrl(null)
    if (!path) return
    let live = true
    void firstImage(path).then((found) => {
      if (live) setUrl(found)
    })
    return () => {
      live = false
    }
  }, [path])

  return url
}

/**
 * Asset paths, without extension. Kept here so the asset list has exactly one
 * source of truth.
 */
export const portrait = {
  hero: (heroClass: string) => `portraits/hero-${heroClass}`,
  enemy: (enemyType: string) => `portraits/enemy-${enemyType}`,
  crew: (speciality: string) => `portraits/crew-${speciality}`,
}

export const cardArt = (cardId: string) => `cards/${cardId}`

// -------------------------------------------------------------------- sound

export function soundEnabled(): boolean {
  try {
    return window.localStorage.getItem(SOUND_ENABLED_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_ENABLED_KEY, on ? 'on' : 'off')
  } catch {
    // A browser with no storage still gets sound this session; nothing to do.
  }
}

/**
 * Play a sound effect if its file exists and sound is on. Silent otherwise.
 *
 * The probe makes this asynchronous, so the very first occurrence of a sound may
 * arrive a beat late. Everything after it is instant, and a game must never
 * stall on audio — autoplay policies can refuse outright, and that is fine too.
 */
export function playSfx(name: SfxName): void {
  if (!soundEnabled()) return
  const url = assetUrl(`audio/${name}.mp3`)
  void probe(url).then((exists) => {
    if (!exists || !soundEnabled()) return
    let audio = audioCache.get(url)
    if (!audio) {
      audio = new Audio(url)
      audio.volume = 0.5
      audioCache.set(url, audio)
    }
    try {
      audio.currentTime = 0
      void audio.play().catch(() => {})
    } catch {
      // Some browsers throw on currentTime before metadata; not worth caring.
    }
  })
}
