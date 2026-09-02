// Rooms: how a table of people finds each other, and how it finds itself again.
//
// Three jobs, and they are deliberately done by one short string.
//
// 1. A room code has to be READABLE ALOUD. Six to eight characters, no letters
//    that sound alike over a phone, no case to get wrong.
// 2. It has to CARRY THE SETUP. The whole expedition is generated from a seed,
//    a length and a party size, so a code that contains those three things means
//    everybody at the table builds a bitwise identical galaxy without a single
//    byte crossing the network. That is the trick the deterministic engine buys
//    us, and it is why joining a game is instant even before anyone connects.
// 3. It has to be a FILING NAME. Every player's browser stores what it knows of
//    a room under its code, so a game can be picked up next week by the same
//    people — or by the same person, if the others are asleep.
//
// The difficulty dials are NOT in the code: they are the host's, and they arrive
// with the first sync. Putting them in would have doubled the code's length to
// carry something nobody dictates over the phone.

import type { HeroClassId } from '../types'
import type { ExpeditionLength } from '../expedition/types'

// ---------------------------------------------------------------- the modes

export type GameMode =
  /** One person, running the whole party. */
  | 'solo'
  /** Two to four people at one keyboard: the game as it has always been. */
  | 'local'
  /** Two to four people, each on their own machine. */
  | 'online'

export const GAME_MODES: GameMode[] = ['solo', 'local', 'online']

/** How many people a mode seats. Solo is one by definition. */
export function seatsAllowed(mode: GameMode): number[] {
  return mode === 'solo' ? [1] : [2, 3, 4]
}

// ---------------------------------------------------------------- the seats

export type Seat = {
  /** One to four, in the order they sit down. Also the hero's `playerSlot`. */
  slot: number
  /** Which hero this seat runs. */
  heroClass: HeroClassId
  /** What this player calls themselves. Empty until somebody sits down. */
  name: string
  /**
   * The tag of the player key that claimed the seat, or null while it is free.
   *
   * A tag rather than the key itself: the room state is broadcast to everybody,
   * and there is no reason to hand each player the others' keys. It is a name
   * tag, not a lock — this is a co-operative game between friends, and the only
   * thing it has to survive is a misclick, not an attacker.
   */
  claimedBy: string | null
}

export type RoomState = {
  code: string
  mode: GameMode
  /** The tag of whoever opened the room. They settle disputes and free seats. */
  hostKey: string
  seats: Seat[]
}

// ------------------------------------------------------------- who you are

export type PlayerIdentity = {
  /** Secret-ish, and yours. Kept in this browser, and shown so it can be copied. */
  key: string
  name: string
}

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** A random key for this browser. Crockford base32, so it can be read out. */
export function newPlayerKey(): string {
  const bytes = new Uint8Array(15)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const byte of bytes) {
    out += ALPHABET[byte >> 3]!
  }
  return out
}

/**
 * The public tag of a key: eight characters, stable, and not reversible in any
 * way that matters here.
 *
 * FNV-1a rather than a real hash, because it has to be synchronous — the state
 * is built inside a pure reducer, and `crypto.subtle` is a promise. Again: this
 * marks whose seat it is, it does not defend anything.
 */
export function keyTag(key: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

// ---------------------------------------------------------------- the code

const LENGTHS: ExpeditionLength[] = ['short', 'medium', 'long']

export type RoomSetup = {
  seed: number
  length: ExpeditionLength
  /** Seats at the table: 1 to 4. */
  players: number
}

/** Seeds are cut to 28 bits so that the whole setup fits in eight characters. */
export const SEED_BITS = 0xfffffff

function checksum(payload: number): number {
  // Eight bits over the four bytes of the payload. Enough that a mistyped
  // character is caught rather than silently opening somebody else's galaxy.
  let hash = 0x9e
  for (let i = 0; i < 4; i++) {
    hash = (hash ^ ((payload >>> (i * 8)) & 0xff)) & 0xff
    hash = ((hash << 1) | (hash >>> 7)) & 0xff
  }
  return hash
}

/**
 * The setup, as eight characters.
 *
 * 28 bits of seed, 2 of length, 2 of party size, 8 of checksum: forty bits, and
 * base32 turns forty bits into exactly eight characters with nothing left over.
 */
export function roomCode(setup: RoomSetup): string {
  const seed = setup.seed & SEED_BITS
  const length = Math.max(0, LENGTHS.indexOf(setup.length))
  const players = Math.max(1, Math.min(4, setup.players)) - 1
  const payload = (seed * 16 + length * 4 + players) >>> 0
  // Built by multiplication rather than shifts: forty bits is past what the
  // bitwise operators can hold, and a silently truncated code is unfindable.
  let value = payload * 256 + checksum(payload)

  let out = ''
  for (let i = 0; i < 8; i++) {
    const place = Math.pow(32, 7 - i)
    const digit = Math.floor(value / place) % 32
    out += ALPHABET[digit]!
    value -= digit * place
  }
  return out
}

/** How the code is shown: `ABCD-EFGH`, because people read it in fours. */
export function formatRoomCode(code: string): string {
  const clean = normaliseRoomCode(code)
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

/**
 * What somebody typed, made into what the code actually is.
 *
 * Crockford's forgiveness: case does not matter, dashes and spaces are ignored,
 * and the letters that look like digits are read as digits. Somebody reading a
 * code down the phone should not be able to get it wrong in a way we could have
 * fixed for them.
 */
export function normaliseRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
}

/** The setup a code carries, or null if it is not a code at all. */
export function parseRoomCode(raw: string): RoomSetup | null {
  const clean = normaliseRoomCode(raw)
  if (clean.length !== 8) return null

  let value = 0
  for (const char of clean) {
    const digit = ALPHABET.indexOf(char)
    if (digit < 0) return null
    value = value * 32 + digit
  }

  const payload = Math.floor(value / 256)
  const found = value % 256
  if (checksum(payload) !== found) return null

  const players = (payload % 4) + 1
  const length = LENGTHS[Math.floor(payload / 4) % 4] ?? 'medium'
  const seed = Math.floor(payload / 16)
  return { seed, length, players }
}

// --------------------------------------------------------------- the table

/**
 * A fresh room for a setup.
 *
 * Seats are dealt in the party's own order, so seat one is always the Runesmith
 * and the fourth chair is always the Surveyor. That matters more than it looks:
 * "you are seat three" has to mean the same thing on four machines that have
 * never spoken to each other.
 */
export function newRoom(
  setup: RoomSetup,
  mode: GameMode,
  party: HeroClassId[],
  host: PlayerIdentity,
): RoomState {
  const seats: Seat[] = party.map((heroClass, i) => ({
    slot: i + 1,
    heroClass,
    name: '',
    claimedBy: null,
  }))
  const room: RoomState = {
    code: roomCode(setup),
    mode,
    hostKey: keyTag(host.key),
    seats,
  }
  // Solo means one person runs everybody, so every seat is theirs at once.
  const mine = mode === 'solo' ? seats : seats.slice(0, 1)
  for (const seat of mine) {
    seat.claimedBy = keyTag(host.key)
    seat.name = host.name
  }
  return room
}

export function seatsOf(room: RoomState, tag: string): Seat[] {
  return room.seats.filter((seat) => seat.claimedBy === tag)
}

export function freeSeats(room: RoomState): Seat[] {
  return room.seats.filter((seat) => seat.claimedBy === null)
}

/** Is this hero mine to move? In anything but an online room, everything is. */
export function controls(room: RoomState | null, tag: string, heroClass: HeroClassId): boolean {
  if (!room || room.mode !== 'online') return true
  const seat = room.seats.find((s) => s.heroClass === heroClass)
  return seat?.claimedBy === tag
}

/**
 * Sit somebody down by their tag, in the first free seat or in a particular one.
 *
 * By tag rather than by identity, because the host seats the guests and never
 * has their keys — only the tags they announced. `claimSeat` is the same thing
 * for the person actually holding the key.
 */
export function seatByTag(
  room: RoomState,
  tag: string,
  name: string,
  slot?: number,
): RoomState {
  // Already sitting? Then this is a rejoin, and the seat is simply still theirs.
  if (seatsOf(room, tag).length > 0 && slot === undefined) return room

  const seats = room.seats.map((seat) => ({ ...seat }))
  const wanted =
    slot === undefined ? seats.find((s) => s.claimedBy === null) : seats.find((s) => s.slot === slot)
  if (!wanted || wanted.claimedBy !== null) return room
  wanted.claimedBy = tag
  wanted.name = name || wanted.name
  return { ...room, seats }
}

/**
 * Change the name on a seat, without touching who is sitting in it.
 *
 * Typing your name must never cost you your chair — and, far worse, it must
 * never cost anybody the connection. The name used to be part of the network
 * effect's dependency list, so every keystroke in the lobby's name box tore the
 * WebRTC peer down and re-registered it with the broker. See `useRoomNetwork`.
 */
export function renameSeat(room: RoomState, tag: string, name: string): RoomState {
  const seats = room.seats.map((seat) =>
    seat.claimedBy === tag ? { ...seat, name } : { ...seat },
  )
  return { ...room, seats }
}

/** Sit down in the first free seat, or in a particular one. */
export function claimSeat(room: RoomState, who: PlayerIdentity, slot?: number): RoomState {
  return seatByTag(room, keyTag(who.key), who.name, slot)
}

/**
 * Empty a seat.
 *
 * The host can do this to anybody, and anybody can do it to their own. It is the
 * answer to the one thing a player key cannot survive: a browser wiped with the
 * key not written down. Somebody at the table frees the chair and they sit down
 * again as a new person.
 */
export function releaseSeat(room: RoomState, by: string, slot: number): RoomState {
  const seats = room.seats.map((seat) => ({ ...seat }))
  const target = seats.find((s) => s.slot === slot)
  if (!target) return room
  if (by !== room.hostKey && target.claimedBy !== by) return room
  target.claimedBy = null
  target.name = ''
  return { ...room, seats }
}

/** Everybody is in their chair and the expedition can start. */
export function roomIsSeated(room: RoomState): boolean {
  return room.seats.every((seat) => seat.claimedBy !== null)
}

/**
 * Put a different hero in a seat.
 *
 * Who plays whom is a decision, not a dealing order. It is also the first thing
 * anybody asks at a table — "can I be the one with the cannon" — and having the
 * answer be "no, seat three is always the Cantor" would be a strange thing for a
 * game to insist on.
 *
 * Two rules: nobody may take a class somebody else is already playing, and a
 * seat is changed by the person sitting in it or by the host. (Before the
 * expedition sets out, that is: afterwards the party is on the ship and the
 * question is closed. The lobby is the only screen that offers this.)
 */
export function pickHero(
  room: RoomState,
  by: string,
  slot: number,
  heroClass: HeroClassId,
): RoomState {
  const index = room.seats.findIndex((s) => s.slot === slot)
  const seat = room.seats[index]
  if (!seat) return room
  if (by !== room.hostKey && seat.claimedBy !== by) return room

  const classes = assignHero(
    room.seats.map((s) => s.heroClass),
    index,
    heroClass,
  )
  return {
    ...room,
    seats: room.seats.map((s, i) => ({ ...s, heroClass: classes[i]! })),
  }
}

/**
 * Put `heroClass` at `index`, keeping every entry distinct.
 *
 * At a full table nothing is ever "free": four seats, four classes. So asking for
 * somebody else's hero is an EXCHANGE — you offer yours for theirs, which is what
 * "shall we swap?" means at a table anyway, and it keeps the one rule that
 * matters: no two people playing the same hero.
 *
 * Pure and free of any room, because the same choice is made on the title screen
 * before there is a room at all.
 */
export function assignHero(
  party: readonly HeroClassId[],
  index: number,
  heroClass: HeroClassId,
): HeroClassId[] {
  const current = party[index]
  if (current === undefined || current === heroClass) return [...party]
  return party.map((id, i) => {
    if (i === index) return heroClass
    if (id === heroClass) return current
    return id
  })
}

/** Which classes nobody at this table has taken. */
export function freeHeroes(room: RoomState, all: readonly HeroClassId[]): HeroClassId[] {
  const taken = new Set(room.seats.map((seat) => seat.heroClass))
  return all.filter((id) => !taken.has(id))
}
