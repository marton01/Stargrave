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
