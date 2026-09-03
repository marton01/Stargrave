// Which signalling server the table meets at.
//
// WebRTC connects two browsers directly, but they cannot find each other on
// their own: somebody has to hold the door open while they exchange addresses.
// That is all a signalling server does, and once the two are talking it is out
// of the conversation — no game data ever passes through it.
//
// By default that is PeerJS's free public one. It is free, which is the whole
// reason this game can be played over the internet from a static page with no
// backend of its own — and it is also the single point in the system that
// somebody else operates.
//
// WHY THIS FILE EXISTS
//
// It goes down, and it is blocked. A player whose ISP, workplace, school
// network, DNS filter or ad-blocker does not like `0.peerjs.com` gets a console
// full of "WebSocket connection failed" and a lobby that never opens, while
// everybody else in the same group is fine. Nothing about that is diagnosable
// from inside the game unless the game says so — and nothing about it is fixable
// unless the game can be pointed somewhere else.
//
// So: the address is a setting. Anybody can run a PeerServer (`npx peerjs
// --port 9000`), and a group that cannot reach the public one can meet at one of
// their own instead. Everybody at the table has to use the same one, which is
// why it is written in plain sight in the lobby rather than hidden in a config.

const KEY = 'stargrave.broker'

export type BrokerOptions = {
  host: string
  port: number
  path: string
  secure: boolean
  key: string
}

/** What PeerJS uses when nothing is set: its own free cloud. */
export const DEFAULT_BROKER = '0.peerjs.com'

/**
 * The address as the player typed it, or empty for the default.
 *
 * Kept in this browser only. It is a network setting, not part of the game, and
 * it must survive wiping the save — somebody who has had to point the game
 * somewhere else should not have to do it twice.
 */
export function brokerHost(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setBrokerHost(host: string): void {
  try {
    const trimmed = host.trim()
    if (trimmed) localStorage.setItem(KEY, trimmed)
    else localStorage.removeItem(KEY)
  } catch {
    // A browser with storage switched off still gets to play; it just cannot
    // remember the address between reloads.
  }
}

/**
 * Turn what somebody typed into PeerJS options, or undefined for the default.
 *
 * Deliberately forgiving about the form, because the thing being pasted is
 * usually copied out of a terminal or a chat message:
 *
 *   peerjs.example.com              → wss://peerjs.example.com:443/
 *   https://peerjs.example.com      → the same
 *   peerjs.example.com:9000         → wss://peerjs.example.com:9000/
 *   http://192.168.1.7:9000/myapp   → ws://192.168.1.7:9000/myapp
 *
 * `http://` means an insecure server on purpose — that is what `npx peerjs`
 * gives you on a home network, and a group on the same wifi is exactly who needs
 * this most. Browsers refuse insecure sockets from a page served over https, so
 * that combination is the one case this cannot rescue; the lobby says so.
 */
/**
 * Could this string possibly be a name the network can resolve?
 *
 * This exists because of one evening lost to it. A player was told they might
 * need a tunnel to reach a signalling server of their own, and they pasted the
 * TUNNEL'S ID into the address box — a bare uuid, which has no colon and no
 * slash and so sailed straight through every check here. The game then spent the
 * evening opening sockets to `wss://1212d1bd-61d0-.../peerjs` and reporting
 * `ERR_NAME_NOT_RESOLVED`, which tells a player nothing at all.
 *
 * A real host has a dot in it (`peerjs.example.com`, `192.168.1.7`) or is
 * exactly `localhost`. Nothing else can be looked up, so nothing else is worth
 * opening a socket to.
 */
export function hostLooksReal(host: string): boolean {
  const name = host.toLowerCase()
  if (name === 'localhost') return true
  // Legal hostname characters only: letters, digits, dots and hyphens.
  if (!/^[a-z0-9.-]+$/.test(name)) return false
  // A label cannot be empty, so no leading, trailing or doubled dots.
  if (name.startsWith('.') || name.endsWith('.') || name.includes('..')) return false
  return name.includes('.')
}

/**
 * Why a typed address was refused, for the lobby to say out loud.
 *
 * `null` means it is either usable or empty (the default). Anything else is a
 * setting that is quietly doing nothing, which is worse than no setting.
 */
export function brokerProblem(raw = brokerHost()): 'host' | 'port' | null {
  const text = raw.trim()
  if (!text) return null
  if (brokerOptions(text)) return null
  const bare = text.replace(/^https?:\/\//i, '')
  const authority = bare.split('/')[0] ?? ''
  const colon = authority.lastIndexOf(':')
  const host = colon > 0 ? authority.slice(0, colon) : authority
  return hostLooksReal(host) ? 'port' : 'host'
}

export function brokerOptions(raw = brokerHost()): BrokerOptions | undefined {
  const text = raw.trim()
  if (!text) return undefined

  let secure = true
  let rest = text
  if (/^https:\/\//i.test(rest)) rest = rest.slice(8)
  else if (/^http:\/\//i.test(rest)) {
    secure = false
    rest = rest.slice(7)
  }

  const slash = rest.indexOf('/')
  const authority = slash >= 0 ? rest.slice(0, slash) : rest
  const path = slash >= 0 ? rest.slice(slash) : '/'

  const colon = authority.lastIndexOf(':')
  const host = colon > 0 ? authority.slice(0, colon) : authority
  const port = colon > 0 ? Number(authority.slice(colon + 1)) : secure ? 443 : 80
  // Refuse rather than half-configure. A broker address that is nearly right
  // fails as a wall of websocket errors with nothing to point at, which is the
  // exact situation this file exists to end.
  if (!host || host.includes(':') || host.includes('/')) return undefined
  if (!hostLooksReal(host)) return undefined
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return undefined

  return { host, port, path: path.endsWith('/') ? path : `${path}/`, secure, key: 'peerjs' }
}

/**
 * Would this address be refused by the browser before it is even tried?
 *
 * A page served over https cannot open a plain `ws://` socket. It is worth
 * catching here because the failure is silent and total, and the fix — use
 * https, or run the page over http too — is not something anybody guesses.
 */
export function brokerIsInsecureFromHttps(raw = brokerHost()): boolean {
  const options = brokerOptions(raw)
  if (!options || options.secure) return false
  return typeof location !== 'undefined' && location.protocol === 'https:'
}

/** The url PeerJS would fetch an id from — plain https, no socket involved. */
export function brokerHttpUrl(raw = brokerHost()): string {
  const o = brokerOptions(raw)
  if (!o) return `https://${DEFAULT_BROKER}/peerjs/id?key=peerjs`
  return `${o.secure ? 'https' : 'http'}://${o.host}:${o.port}${o.path}peerjs/id?key=peerjs`
}

/** The url PeerJS actually opens its socket to. */
export function brokerSocketUrl(raw = brokerHost()): string {
  const o = brokerOptions(raw)
  const id = `probe-${Math.random().toString(36).slice(2, 10)}`
  const token = Math.random().toString(36).slice(2, 10)
  const query = `peerjs?key=peerjs&id=${id}&token=${token}&version=1.5.5`
  if (!o) return `wss://${DEFAULT_BROKER}/${query}`
  return `${o.secure ? 'wss' : 'ws'}://${o.host}:${o.port}${o.path}${query}`
}

export type BrokerProbe = {
  /** Can we fetch an id over ordinary https? */
  http: boolean
  /** Can we open the websocket the game actually needs? */
  ws: boolean
}

/**
 * Ask the two questions separately, because the answers are usually different.
 *
 * This exists because the first version of the diagnostic tested the wrong
 * thing. It opened the broker's `/id` endpoint in a tab — ordinary https — and a
 * player whose machine answers that perfectly well got a clean bill of health
 * while the game still could not connect. Their sockets were being killed and
 * nothing said so.
 *
 * https working and the websocket failing is not a vague "network problem": it
 * is a short, specific list. Security software that inspects https (Kaspersky,
 * ESET, Avast and friends) frequently breaks the `Upgrade` handshake; so do
 * corporate and school proxies that were never taught about it; so do browser
 * extensions with a websocket rule, and `peerjs.com` sits on more than one
 * blocklist because peer-to-peer is what it is for. Knowing WHICH of the two
 * layers failed is the difference between guessing and fixing.
 */
export async function probeBroker(raw = brokerHost()): Promise<BrokerProbe> {
  const http = await fetch(brokerHttpUrl(raw), { cache: 'no-store' })
    .then((response) => response.ok)
    .catch(() => false)

  const ws = await new Promise<boolean>((resolve) => {
    let socket: WebSocket
    try {
      socket = new WebSocket(brokerSocketUrl(raw))
    } catch {
      resolve(false)
      return
    }
    // A socket that neither opens nor errors is a failure too — that is exactly
    // what a proxy holding the upgrade looks like.
    const timer = setTimeout(() => {
      try {
        socket.close()
      } catch {
        // Already gone.
      }
      resolve(false)
    }, 8000)
    const settle = (ok: boolean) => {
      clearTimeout(timer)
      try {
        socket.close()
      } catch {
        // Already gone.
      }
      resolve(ok)
    }
    socket.onopen = () => settle(true)
    socket.onerror = () => settle(false)
    socket.onclose = () => settle(false)
  })

  return { http, ws }
}

// ------------------------------------------------------------------ cooldown
//
// The failure this whole file was written for turned out to be self-inflicted.
//
// The public broker sits behind Cloudflare, and a browser that keeps asking gets
// **Error 1015 — you are being rate limited**: the address is banned for a
// while, and everybody behind it goes down together. This game earned exactly
// that. A saved online room was dialled on every page load, from the title
// screen, and a failure retried every two and a half seconds for ever. Some
// players' households were banned; the ban then looked, from inside, like a
// firewall blocking websockets — https still answered, the socket did not.
//
// Backing off is not enough on its own, because a reload resets the counter and
// the hammering starts again — so the ban never gets a chance to expire. The
// cooldown is what makes giving up mean something: it survives a reload.

const COOLDOWN_KEY = 'stargrave.netCooldown'

/**
 * How long to leave the broker alone once it has stopped answering.
 *
 * Cloudflare's rate-limit bans run to about an hour, and every request made
 * while one is in force can extend it. Half an hour is the compromise: long
 * enough that most bans have expired by the time the game next knocks, short
 * enough that nobody has given up on the evening. There is a button to override
 * it for anybody who knows better.
 */
export const COOLDOWN_MS = 30 * 60 * 1000

/** Milliseconds left before it is polite to try again, or zero. */
export function cooldownLeft(): number {
  try {
    const until = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0)
    if (!Number.isFinite(until)) return 0
    return Math.max(0, until - Date.now())
  } catch {
    return 0
  }
}

export function startCooldown(ms = COOLDOWN_MS): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now() + ms))
  } catch {
    // Storage off: the backoff within this tab still holds.
  }
}

export function clearCooldown(): void {
  try {
    localStorage.removeItem(COOLDOWN_KEY)
  } catch {
    // Nothing to clear.
  }
}
