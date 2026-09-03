// The application shell.
//
// One state, one reducer, one save. The shell owns the top bar (week, Gate,
// resources, navigation, language, help) and hands the body to whichever screen
// the expedition says is current.
//
// Saving is automatic after every action, which is the promise the design makes:
// you never lose the evening's work, and there is no reloading to undo a decision.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArchiveView } from './ui/strategic/ArchiveView'
import { Guide } from './ui/Guide'
import { bankExpedition, newArchive, purchaseUnlock } from './engine/expedition/archive'
import {
  canAdvanceWeek,
  expeditionStep,
  livingCrew,
  party,
  understandingTierOf,
} from './engine/expedition/expedition'
import type { ExpeditionAction } from './engine/expedition/expedition'
import {
  clearSave,
  ensurePlayer,
  forgetRoom,
  listRooms,
  loadDialPreset,
  loadGame,
  loadRoomGame,
  parseSave,
  renameSavedRoom,
  saveDialPreset,
  saveFileName,
  saveGame,
  savePlayer,
  saveRoomGame,
  serialiseSave,
} from './engine/expedition/save'
import {
  keyTag,
  newRoom,
  parseRoomCode,
  roomCode as makeRoomCode,
  seatNames,
} from './engine/session/room'
import type { GameMode, PlayerIdentity, RoomState } from './engine/session/room'
import { blockedBy, mayAct } from './engine/session/permissions'
import { needsSeconding, proposalLabel } from './engine/expedition/expedition'
import { HERO_CLASSES } from './content/heroes'
import { pick } from './i18n/ui'
import { useRoomNetwork } from './net/useRoomNetwork'
import { LobbyView } from './ui/strategic/LobbyView'
import { describeExpeditionEvent } from './i18n/describeExpedition'
import { EncounterView, MarketView } from './ui/strategic/EncounterView'
import { GateView, HeartView, OverView } from './ui/strategic/EndView'
import { ConsoleView } from './ui/strategic/ConsoleView'
import { DifficultyPanel } from './ui/DifficultyPanel'
import { Help } from './ui/Help'
import type { HelpTopic } from './ui/Help'
import { LangProvider, useLang } from './i18n/LangContext'
import { setSoundEnabled, soundEnabled } from './ui/assets'
import { MissionView } from './ui/MissionView'
import { DEFAULT_LEVEL, DIALS, defaultDials, dialValue } from './content/difficulty'
import type { DialId } from './content/difficulty'
import { randomSeed } from './engine/rng'
import { RESOURCES, RESOURCE_ORDER } from './content/ship'
import { ResearchView } from './ui/strategic/ResearchView'
import { ShipView } from './ui/strategic/ShipView'
import { ChangeSummary, shotOf, summaryMatters } from './ui/strategic/ChangeSummary'
import type { Shot, Summary, SummaryKind } from './ui/strategic/ChangeSummary'
import { StarMapView } from './ui/strategic/StarMapView'
import {
  HERALD_WAKES_AT,
  heraldDistance,
  partyForSeats,
  projectWeek,
  resourceMax,
  startExpedition,
} from './engine/expedition/expedition'
import type {
  ArchiveUnlockId,
  ExpeditionLength,
  ExpeditionState,
  GameState,
  Screen,
} from './engine/expedition/types'
import type { HeroClassId, Lang } from './engine/types'
import { useEventSounds } from './ui/useEventSounds'

export function App() {
  return (
    <LangProvider>
      <Game />
    </LangProvider>
  )
}

const NAV: {
  screen: Screen
  labelKey: 'shipHeading' | 'starMapHeading' | 'researchHeading' | 'consolesHeading'
}[] = [
  { screen: 'ship', labelKey: 'shipHeading' },
  { screen: 'starmap', labelKey: 'starMapHeading' },
  { screen: 'research', labelKey: 'researchHeading' },
  // The two players' own screen. Fourth rather than first: it is where you go
  // once the week is set up, not where the week starts.
  { screen: 'consoles', labelKey: 'consolesHeading' },
]

/**
 * The session: the game, plus the way back out of a misclick.
 *
 * The history is deliberately not part of `GameState` and never saved — it
 * belongs to this sitting at the keyboard, not to the expedition — and it only
 * ever holds battle states. See `rewindable` for why only battles.
 */
type Session = {
  game: GameState
  undo: ExpeditionState[]
  /**
   * Where the numbers stood when the current scene opened, for the scenes whose
   * effect arrives in pieces: a market visit is several purchases, an encounter
   * is a choice and sometimes a payment. Their summary is of the whole visit.
   */
  mark: { kind: SummaryKind; shot: Shot } | null
  /** The box waiting to be read, if an event has just finished. */
  summary: Summary | null
}

/** The scene a screen belongs to, for the marks above. */
function sceneOf(screen: Screen): SummaryKind | null {
  if (screen === 'encounter') return 'encounter'
  if (screen === 'market') return 'market'
  return null
}

/**
 * What just happened to the ship's numbers, if it is worth saying out loud.
 *
 * A week and a mission are single steps, so they are their own before and after.
 * An encounter or a market visit is not: the summary for those is opened when the
 * screen is entered and closed when it is left, so buying four things at one post
 * is one account rather than four.
 */
function summaryFor(
  action: ExpeditionAction,
  before: ExpeditionState,
  after: ExpeditionState,
  mark: Session['mark'],
): Summary | null {
  if (action.k === 'advanceWeek') return { kind: 'week', before: shotOf(before), after: shotOf(after) }
  if (action.k === 'missionFinish') return { kind: 'mission', before: shotOf(before), after: shotOf(after) }

  const left = sceneOf(before.screen)
  if (mark && left !== null && sceneOf(after.screen) !== left) {
    return { kind: mark.kind, before: mark.shot, after: shotOf(after) }
  }
  return null
}

/** How far back a battle can be rewound. Longer than any mission needs. */
const UNDO_LIMIT = 200

/** Which battle is on the table, if any. Changes when a mission starts or ends. */
function battleOnTable(state: ExpeditionState): string | null {
  const mission = state.activeMission
  return mission && mission.k === 'battle' ? mission.nodeId : null
}

/**
 * May this action be taken back?
 *
 * Only inside a battle, and the reason is information rather than randomness.
 * Every random draw in the game comes from `seed + rngStep`, and both live in
 * the state — so a rewound action, replayed, gives exactly the same result.
 * There is nothing to fish for by retrying.
 *
 * What an undo *could* give away elsewhere is knowledge: how an encounter turned
 * out, what a puzzle probe revealed. A battle has no such secret — enemy intents
 * are shown before cards are picked and the enemy AI is deterministic — so
 * taking a move back there can only ever undo a slip.
 */
function rewindable(action: ExpeditionAction, before: ExpeditionState, after: ExpeditionState): boolean {
  if (action.k !== 'battleAction') return false
  const battle = battleOnTable(before)
  return battle !== null && battle === battleOnTable(after)
}

function Game() {
  const { t, s, lang, setLang } = useLang()
  const [session, setSession] = useState<Session>(() => ({
    game: loadGame() ?? { archive: newArchive(), expedition: null, room: null },
    undo: [],
    mark: null,
    summary: null,
  }))
  const game = session.game

  /**
   * Everything that is not a move in a battle: the history goes, because there
   * is nothing sensible to rewind to across a new expedition, an imported save
   * or a banked result.
   */
  const setGame = useCallback((update: GameState | ((previous: GameState) => GameState)) => {
    setSession((current) => {
      const game = typeof update === 'function' ? update(current.game) : update
      return { game, undo: [], mark: null, summary: null }
    })
  }, [])
  // Who this browser is. Made once, kept for good, and the thing that puts
  // somebody back in their own chair after a week away.
  const [identity, setIdentity] = useState<PlayerIdentity>(() => ensurePlayer())
  const tag = useMemo(() => keyTag(identity.key), [identity.key])
  const [rooms, setRooms] = useState(() => listRooms())
  /** Why the last click did nothing, when it did nothing. Clears itself. */
  const [refused, setRefused] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(() => !loadGame()?.expedition)
  /** Set when the host closed the room out from under us, so the archive can say so. */
  const [roomWasClosed, setRoomWasClosed] = useState(false)
  /**
   * Which step of the walk this player is on, or null for "not showing".
   *
   * Kept in this browser rather than in the game state, because it is one
   * person's place in an explanation — not something the table shares. A
   * tutorial expedition opens it; anybody can shut it and open it again.
   */
  const [guideStep, setGuideStep] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem('stargrave.guide')
      return raw === null ? null : Number(raw)
    } catch {
      return null
    }
  })
  const setGuide = useCallback((step: number | null) => {
    setGuideStep(step)
    try {
      if (step === null) localStorage.removeItem('stargrave.guide')
      else localStorage.setItem('stargrave.guide', String(step))
    } catch {
      // A browser with storage off still gets the walk, just not across reloads.
    }
  }, [])
  const [helpOpen, setHelpOpen] = useState(false)
  const [wipeOpen, setWipeOpen] = useState(false)
  const [dialsOpen, setDialsOpen] = useState(false)
  // Whether there is a preset to offer. Read once and kept, so the button does
  // not flicker in and out as the panel is used.
  const [hasPreset, setHasPreset] = useState(() => loadDialPreset() !== null)
  const [sound, setSound] = useState(() => soundEnabled())
  const downloadRef = useRef<HTMLAnchorElement | null>(null)
  /**
   * The room code, readable from a callback that must not depend on the render
   * it was made in — `onClosed` is handed to the network once and lives as long
   * as the connection does.
   */
  const roomCodeRef = useRef<string | null>(null)

  /**
   * Apply an action to the game here, on this machine.
   *
   * In an online room this is never called directly by a click: it is called by
   * the network layer when an action arrives with its place in the order on it.
   * That is the whole of how four machines stay identical — see net/protocol.ts.
   */
  const applyAction = useCallback((action: ExpeditionAction) => {
    setSession((current) => {
      const before = current.game.expedition
      if (!before) return current
      const after = expeditionStep(before, action)
      const entered = sceneOf(after.screen)
      const summary = summaryFor(action, before, after, current.mark)
      return {
        game: { ...current.game, expedition: after },
        undo: rewindable(action, before, after)
          ? [...current.undo, before].slice(-UNDO_LIMIT)
          : [],
        // A scene keeps its mark until it is left; a new one takes a fresh one,
        // and so does a scene that has just had an account rendered inside it —
        // a week ended at a trading post must not be charged to the trading.
        mark:
          entered === null
            ? null
            : current.mark && current.mark.kind === entered && summary === null
              ? current.mark
              : { kind: entered, shot: shotOf(after) },
        summary: summary && summaryMatters(summary) ? summary : current.summary,
      }
    })
  }, [])

  const setRoom = useCallback((room: RoomState) => {
    setSession((current) => ({ ...current, game: { ...current.game, room } }))
  }, [])

  const setExpedition = useCallback((expedition: ExpeditionState) => {
    setSession((current) => ({
      ...current,
      game: { ...current.game, expedition },
      undo: [],
      mark: null,
      summary: null,
    }))
    setShowArchive(false)
  }, [])

  /**
   * The host closed the room. Go home, and take it off the list.
   *
   * Not a save that is lost: the expedition dies with the room because the room
   * WAS the expedition — it is the host's copy that is authoritative, and there
   * is no longer a host.
   */
  const roomClosed = useCallback(() => {
    const code = roomCodeRef.current
    if (code) forgetRoom(code)
    setSession((current) => ({
      ...current,
      game: { ...current.game, room: null, expedition: null },
      undo: [],
      mark: null,
      summary: null,
    }))
    setRooms(listRooms())
    setShowArchive(true)
    setRoomWasClosed(true)
  }, [])

  // Keep the ref in step with the room, for the callbacks that outlive a render.
  useEffect(() => {
    roomCodeRef.current = game.room?.code ?? null
  }, [game.room])

  const net = useRoomNetwork({
    room: game.room,
    // Only dial when this player is actually at the table. See `active`.
    active: !showArchive,
    identity,
    expedition: game.expedition,
    onApply: applyAction,
    onClosed: roomClosed,
    onRoom: setRoom,
    onExpedition: setExpedition,
  })

  /**
   * What a click does.
   *
   * Offline it applies straight away. In an online room it goes through the
   * network first — and if the action belongs to somebody else's hero, it does
   * not go at all. See engine/session/permissions.ts for what "belongs" means.
   */
  /**
   * Which seats this machine is playing.
   *
   * All of them at one keyboard — there is one mouse, and hiding half a puzzle
   * from somebody who can lean over and read it would be theatre. In an online
   * room it is whichever chairs this player's key has claimed.
   */
  /**
   * Who is in each chair, by the name they gave themselves in the lobby.
   *
   * Naming yourself already worked — what was missing is that the name was never
   * seen again after the lobby, which is the only place it does not matter. Now
   * it goes wherever the interface says "this one is yours and that one is
   * theirs": the consoles, the action bar, the party list.
   */
  const heroNames = useMemo(() => seatNames(game.room), [game.room])

  const mySeats = useMemo(() => {
    const room = game.room
    if (!room) return [1, 2, 3, 4]
    if (room.mode !== 'online') return room.seats.map((seat) => seat.slot)
    return room.seats.filter((seat) => seat.claimedBy === tag).map((seat) => seat.slot)
  }, [game.room, tag])

  /**
   * The heroes this browser actually runs.
   *
   * Only one thing reads it: whose private console readings are shown. At one
   * keyboard the room is not online and every seat is ours, so everything is
   * open — see `engine/expedition/insight.ts`.
   */
  const myHeroes = useMemo(() => {
    if (!game.expedition) return []
    const seated = party(game.expedition)
    return mySeats.map((slot) => seated[slot - 1]).filter((hero): hero is HeroClassId => !!hero)
  }, [game.expedition, mySeats])

  /**
   * What a click does — and what it says when it does nothing.
   *
   * A refused action used to vanish in silence, which is the worst possible
   * answer: the player cannot tell whether the game is broken, the click missed,
   * or the rule is that it is not their move. So it names whose move it is.
   */
  const dispatch = useCallback(
    (action: ExpeditionAction) => {
      if (!mayAct(game.room, tag, game.expedition, action)) {
        const owner = blockedBy(game.room, game.expedition, action)
        const seat = owner
          ? game.room?.seats.find((entry) => entry.heroClass === owner)
          : undefined
        setRefused(
          owner
            ? t.notYourTurn(seat?.name || pick(HERO_CLASSES[owner].name, lang))
            : t.notYourHero,
        )
        return
      }

      // Irreversible and everybody's: over a network it takes two people. At one
      // keyboard the button's own two-step confirmation is the second pair of
      // hands, so nothing changes there.
      const claimed = game.room?.seats.filter((seat) => seat.claimedBy !== null).length ?? 0
      const mySeat = mySeats[0]
      if (
        game.room?.mode === 'online' &&
        claimed > 1 &&
        mySeat !== undefined &&
        needsSeconding(action)
      ) {
        net.dispatch({ k: 'propose', action, by: mySeat })
        return
      }

      net.dispatch(action)
    },
    [game.room, game.expedition, tag, net, t, lang, mySeats],
  )

  /** One step back in the current battle. */
  const undo = useCallback(() => {
    setSession((current) => {
      const before = current.undo[current.undo.length - 1]
      if (!before) return current
      return {
        ...current,
        game: { ...current.game, expedition: before },
        undo: current.undo.slice(0, -1),
      }
    })
  }, [])

  // Not in an online room: taking a move back here would rewind one machine and
  // leave the other three where they were. The escape hatches in a battle's
  // "Stuck?" menu are the answer there, and they go through the network like
  // everything else.
  // Fades on its own: it is a nudge, not an error to be dismissed.
  useEffect(() => {
    if (!refused) return
    const timer = window.setTimeout(() => setRefused(null), 3500)
    return () => window.clearTimeout(timer)
  }, [refused])

  const canUndo = session.undo.length > 0 && game.room?.mode !== 'online'

  /**
   * Which screen THIS player is looking at.
   *
   * The expedition carries a screen, and it has to: arriving somewhere opens the
   * encounter, launching a landing opens the grid, and everybody at the table
   * needs to be looking at that together. But browsing is not an event — and
   * because every action is replicated, one player opening the star map used to
   * drag all four of them there.
   *
   * So the browsing screens get a local override, held here and nowhere near the
   * engine (a divergence in the shared state, however harmless, is not worth
   * having). Anything the engine moves to clears the override, so the table is
   * pulled together again the moment something actually happens.
   */
  const [ownScreen, setOwnScreen] = useState<Screen | null>(null)
  const tableScreen = game.expedition?.screen ?? 'ship'
  useEffect(() => {
    setOwnScreen(null)
  }, [tableScreen])

  /** The screens a player may wander off to on their own. */
  const browsable: Screen[] = ['ship', 'starmap', 'research', 'consoles', 'crew']

  const openScreen = useCallback(
    (target: Screen) => {
      if (game.room?.mode === 'online' && browsable.includes(target) && browsable.includes(tableScreen)) {
        setOwnScreen(target)
        return
      }
      dispatch({ k: 'openScreen', screen: target })
    },
    [game.room?.mode, tableScreen, dispatch],
  )


  const closeSummary = useCallback(() => {
    setSession((current) => (current.summary ? { ...current, summary: null } : current))
  }, [])

  // Sound follows the log (see ui/useEventSounds.ts) and stays silent unless the
  // audio files have actually been dropped into public/assets/audio.
  useEventSounds(game.expedition)

  const toggleSound = useCallback(() => {
    setSound((on) => {
      setSoundEnabled(!on)
      return !on
    })
  }, [])

  // Automatic saving. There is no reloading to an earlier point — the undo
  // history below is for a misclick in a battle, not for a second attempt at the
  // week — but there is also nothing to lose when the evening ends mid-week.
  useEffect(() => {
    saveGame(game)
    // A room is also filed under its own code, so the same people can come back
    // to it next week — and so anybody at the table can re-host it.
    saveRoomGame(game)
    // And the list of games to carry on with is read from that index, so it has
    // to be re-read here. It was refreshed only when a room was opened or left,
    // which meant stopping for the night sent you to a title screen that had not
    // heard about the run you had just put down.
    setRooms(listRooms())
  }, [game])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const inField =
        event.target instanceof HTMLElement &&
        (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'SELECT' ||
          event.target.tagName === 'TEXTAREA')
      if (inField) return
      if (event.key === 'F1' || event.key === '?') {
        event.preventDefault()
        setHelpOpen((open) => !open)
      }
      // Ctrl+Z does nothing outside a battle: the history is empty there.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
      if (event.key === 'Escape' || event.key === 'Enter') closeSummary()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSummary, undo])

  const startNew = (
    length: ExpeditionLength,
    seed: number | null,
    mode: GameMode,
    players: number,
    party: HeroClassId[],
    /**
     * A run for learning on. Every system is on; nothing it does counts. See
     * `tutorial` on the expedition state and the guard in `bankExpedition`.
     */
    tutorial = false,
  ) => {
    // The seed is cut to what a room code can carry, so that the code somebody
    // reads down the phone rebuilds exactly this galaxy.
    const setup = { seed: (seed ?? randomSeed()) & 0xfffffff, length, players }
    const room = newRoom(setup, mode, party, identity)

    setGame((previous) => ({
      ...previous,
      room,
      // An online table has to gather before it sets out; the others are
      // sitting down while the host looks at the code.
      expedition:
        mode === 'online'
          ? null
          : startExpedition(
              setup.seed,
              length,
              previous.archive,
              // A saved preset is the terms this player likes; a new expedition
              // starts on them rather than making them dial it in again.
              // A tutorial runs the game as designed: the point is to meet every
              // system, not a softened version of some of them.
              tutorial ? defaultDials() : (loadDialPreset() ?? undefined),
              party,
              tutorial,
            ),
    }))
    setRooms(listRooms())
    setShowArchive(false)
    // The walk opens with a tutorial and starts at the beginning.
    if (tutorial) setGuide(0)
  }

  /**
   * Go to a room by its code: one this browser knows, or one somebody read out.
   *
   * Either way the setup comes out of the code itself, so a guest can be sitting
   * in the right galaxy before the host has even noticed them.
   */
  const joinRoom = (code: string) => {
    const known = loadRoomGame(code)
    if (known) {
      setGame((previous) => ({ ...previous, room: known.room, expedition: known.expedition }))
      setShowArchive(false)
      return
    }
    const setup = parseRoomCode(code)
    if (!setup) return
    const party = partyForSeats(setup.players)
    // A room with nobody in it yet: the host's copy arrives when we connect, and
    // whatever it says replaces this.
    const room = newRoom(setup, 'online', party, { key: '', name: identity.name })
    setGame((previous) => ({
      ...previous,
      room: { ...room, code: makeRoomCode(setup), hostKey: '', seats: room.seats.map((s) => ({ ...s, claimedBy: null, name: '' })) },
      expedition: null,
    }))
    setShowArchive(false)
  }

  /**
   * The network cannot be had: carry on as a hotseat game.
   *
   * The escape hatch for the one failure the game itself cannot fix — the
   * signalling server being unreachable from somebody's network. Without this
   * the evening is simply over. The room code carries the seed, so the same
   * galaxy opens on whichever machine everybody can gather around.
   */
  const playLocally = () => {
    setGame((previous) => {
      const room = previous.room
      if (!room) return previous
      const setup = parseRoomCode(room.code)
      if (!setup) return previous
      const party = room.seats.map((seat) => seat.heroClass)
      const tagOfMine = keyTag(identity.key)
      return {
        ...previous,
        room: {
          ...room,
          mode: 'local' as const,
          hostKey: tagOfMine,
          // Everybody is at this keyboard now, so every chair is this player's.
          seats: room.seats.map((seat) => ({
            ...seat,
            claimedBy: tagOfMine,
            name: seat.name || identity.name,
          })),
        },
        expedition:
          previous.expedition ??
          startExpedition(
            setup.seed,
            setup.length,
            previous.archive,
            loadDialPreset() ?? undefined,
            party,
          ),
      }
    })
  }

  const renamePlayer = (name: string) => {
    const next = { ...identity, name }
    setIdentity(next)
    savePlayer(next)
  }

  const returnToArchive = () => {
    setGame((previous) => {
      if (!previous.expedition) return { ...previous, expedition: null }
      // The room is kept: the table is still the table, and the same people can
      // start another expedition together without swapping the code again.
      return {
        archive: bankExpedition(previous.archive, previous.expedition),
        expedition: null,
        room: previous.room,
      }
    })
    setShowArchive(true)
  }

  const exportSave = () => {
    const blob = new Blob([serialiseSave(game)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = downloadRef.current
    if (anchor) {
      anchor.href = url
      anchor.download = saveFileName(game)
      anchor.click()
    }
    // Give the browser a moment to start the download before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  /**
   * Wipe everything and start over: the save in the browser, the Archive, the
   * running expedition. There is no undo for this one, which is why it is asked
   * for twice and why it is the only red button in the game.
   */
  const wipeEverything = useCallback(() => {
    clearSave()
    setHasPreset(false)
    setGame({ archive: newArchive(), expedition: null, room: null })
    setShowArchive(true)
  }, [setGame])

  const importSave = (text: string): boolean => {
    const parsed = parseSave(text)
    if (!parsed) return false
    setGame(parsed)
    setShowArchive(!parsed.expedition)
    return true
  }

  const expedition = game.expedition
  // What the week would do, if the allocation and the postings stay as they are.
  // A whole week is run on a copy for this, so it is memoised on the state.
  const projection = useMemo(() => (expedition ? projectWeek(expedition) : null), [expedition])

  const logLines = useMemo(() => {
    if (!expedition) return []
    return [...expedition.log].reverse().slice(0, 60)
  }, [expedition])

  /**
   * An online room that has not set out yet: the lobby.
   *
   * It comes before the archive check on purpose — a guest who has just typed a
   * code has no expedition yet, and sending them to the title screen would be
   * exactly the wrong answer to "I joined, now what?".
   */
  if (game.room && game.room.mode === 'online' && !expedition && !showArchive) {
    return (
      <div className="app app-archive" data-screen="lobby" data-lang={lang}>
        <TopBarSlim
          lang={lang}
          setLang={setLang}
          onHelp={() => setHelpOpen(true)}
          sound={sound}
          onToggleSound={toggleSound}
        />
        <LobbyView
          room={game.room}
          identity={identity}
          status={net.status}
          isHost={net.isHost}
          onName={renamePlayer}
          onSit={net.sit}
          onStand={net.stand}
          onPick={net.pick}
          onBegin={() => {
            const room = game.room
            if (!room) return
            const setup = parseRoomCode(room.code)
            if (!setup) return
            const opening = startExpedition(
              setup.seed,
              setup.length,
              game.archive,
              loadDialPreset() ?? undefined,
              room.seats.map((seat) => seat.heroClass),
            )
            net.begin(opening)
            setExpedition(opening)
          }}
          onPlayLocally={playLocally}
          onLeave={() => {
            setGame((previous) => ({ ...previous, room: null, expedition: null }))
            setRooms(listRooms())
            setShowArchive(true)
          }}
          onRename={net.rename}
          onClose={() => {
            // Tell the room first, then treat ourselves exactly like a guest who
            // was told: one path, so the host cannot end up in a state no guest
            // can be in.
            net.close()
            roomClosed()
          }}
        />
        {helpOpen && <Help topic="overview" onClose={() => setHelpOpen(false)} />}
      </div>
    )
  }

  if (!expedition || showArchive) {
    return (
      <div className="app app-archive" data-screen="archive" data-lang={lang}>
        <TopBarSlim
          lang={lang}
          setLang={setLang}
          onHelp={() => setHelpOpen(true)}
          onBack={expedition ? () => setShowArchive(false) : undefined}
          sound={sound}
          onToggleSound={toggleSound}
        />
        {roomWasClosed && (
          <p className="app-notice" data-notice="roomClosed">
            {t.roomClosedNotice}
            <button className="button button-small" onClick={() => setRoomWasClosed(false)}>
              {t.summaryClose}
            </button>
          </p>
        )}
        <ArchiveView
          archive={game.archive}
          hasRunningExpedition={!!expedition}
          onRenameRoom={(code, name) => {
            renameSavedRoom(code, name)
            setRooms(listRooms())
            // If it is the run we are holding, keep the copy in hand in step.
            setGame((previous) =>
              previous.room?.code === code
                ? { ...previous, room: { ...previous.room, name: name.trim().slice(0, 40) } }
                : previous,
            )
          }}
          onForgetRoom={(code) => {
            forgetRoom(code)
            setRooms(listRooms())
          }}
          rooms={rooms}
          onJoin={joinRoom}
          onStart={startNew}
          onContinue={() => setShowArchive(false)}
          onUnlock={(id: ArchiveUnlockId) =>
            setGame((previous) => ({ ...previous, archive: purchaseUnlock(previous.archive, id) }))
          }
          onExport={exportSave}
          onImport={importSave}
          onDeleteSave={wipeEverything}
        />
        <a ref={downloadRef} hidden />
        {helpOpen && (
        <Help
          topic="overview"
          onClose={() => setHelpOpen(false)}
          onWalk={() => {
            setGuide(0)
            setHelpOpen(false)
          }}
        />
      )}
      </div>
    )
  }

  // What this player is looking at: their own choice while the table is idle,
  // and whatever the expedition says the moment something happens.
  const screen = (ownScreen && browsable.includes(expedition.screen) ? ownScreen : expedition.screen)
  const inMission = screen === 'mission'

  // Surfaced for the smoke test: when a landing mission is waiting for a target
  // the bot has to know, and reading it off the DOM keeps the test independent
  // of any wording.
  const battlePending =
    expedition.activeMission?.k === 'battle'
      ? (expedition.activeMission.battle.pending?.kind ?? '')
      : ''

  // A compact fingerprint of the battle, for the same reason: a mission that
  // stops advancing has to be catchable from outside, and comparing rendered
  // text does not work when a move changes no words at all.
  const battleFingerprint = (() => {
    const mission = expedition.activeMission
    if (mission?.k !== 'battle') return ''
    const b = mission.battle
    const turn = b.heroTurn
    const active = turn?.active
    return [
      b.round,
      b.orderIndex,
      b.phase,
      b.pending?.kind ?? '-',
      turn ? `${turn.heroId}:${turn.topDone ? 1 : 0}${turn.bottomDone ? 1 : 0}:${turn.choices.length}` : '-',
      active
        ? `${active.cardId}/${active.half}#${active.index}:${active.effects[active.index]?.k ?? 'end'}`
        : 'noActive',
      b.pending ? b.pending.options.slice(0, 6).join(',') : '',
      b.units.map((u) => `${u.hp}@${u.pos.x},${u.pos.y}`).join(';'),
    ].join('|')
  })()

  return (
    <div
      className={`app ${inMission ? 'app-mission' : 'app-strategic'}`}
      data-screen={screen}
      data-lang={lang}
      data-week={expedition.week}
      data-pending={battlePending}
      data-battle={battleFingerprint}
      data-outcome={expedition.outcome ? 'over' : ''}
    >
      <header className="topbar">
        <div className="topbar-left">
          {/* The title is the way back. Every application in the world puts home
              under its own logo, and this one did not — the only route to the
              Archive from inside a run was a button on a different screen. */}
          <h1>
            <button
              className="app-home"
              data-action="goHome"
              title={t.homeTitle}
              onClick={() => setShowArchive(true)}
            >
              {t.appTitle}
            </button>
          </h1>
          <span className="subtitle">
            {t.week} {expedition.week} · {t.gateLeft} {t.gateWeeks(expedition.gateWeeksLeft)}
          </span>
        </div>

        <div className="topbar-middle">
          {RESOURCE_ORDER.map((id) => {
            const delta = projection?.[id]
            const value = expedition.resources[id]
            const max = resourceMax(expedition, id)
            // The cap is always in the tooltip and comes into the open when it is
            // close enough to matter: a gain the hold cannot take is simply lost,
            // and that used to happen with nothing on screen to explain it.
            const nearFull = value >= max * 0.9
            return (
              <div
                key={id}
                className={`meter meter-tight ${nearFull ? 'meter-full' : ''}`}
                title={`${s(RESOURCES[id].name)}: ${value} / ${max}`}
              >
                <span className="meter-label">
                  {RESOURCES[id].icon} {s(RESOURCES[id].name)}
                </span>
                <span className="meter-value">
                  {value}
                  {nearFull && <span className="meter-cap">/{max}</span>}
                  {delta !== undefined && (
                    <span
                      className={`meter-delta ${delta > 0 ? 'gain' : 'loss'}`}
                      title={t.projectionHint}
                    >
                      ({delta > 0 ? '+' : '−'}
                      {Math.abs(delta)})
                    </span>
                  )}
                </span>
              </div>
            )
          })}
          <div className="meter meter-tight">
            <span className="meter-label">☍ {t.crewHeading}</span>
            <span className="meter-value">{livingCrew(expedition).length}</span>
          </div>
          {/*
            The most important number in the game, and for a long time the least
            legible one: "Understanding 8" never said understanding of WHAT. It
            now carries the tier in words — "we are starting to see it" — and the
            question itself is in the tooltip.
          */}
          <div className="meter meter-tight meter-flux" title={t.understandingHint}>
            <span className="meter-label">◈ {t.understanding}</span>
            <span className="meter-value">
              {expedition.understanding}
              <span className="meter-delta">{t.tierName(understandingTierOf(expedition))}</span>
            </span>
          </div>
          {/*
            Attention, from the very first point. A meter that only appears once
            it is dangerous is a trap, and this one is entirely the players' own
            doing — so they get to watch themselves do it.
          */}
          {dialValue(expedition.dials, 'attention') > 0 && (
            <div
              className={`meter meter-tight ${
                expedition.herald ? 'meter-danger' : expedition.attention >= HERALD_WAKES_AT - 3 ? 'meter-full' : ''
              }`}
              title={`${t.attentionHint}${expedition.herald ? ` — ${t.heraldHint}` : ''}`}
            >
              <span className="meter-label">◎ {t.attention}</span>
              <span className="meter-value">
                {expedition.attention}
                <span className="meter-cap">/{HERALD_WAKES_AT}</span>
                {expedition.herald && (
                  <span className="meter-delta loss">
                    {' · '}
                    {t.heraldLabel} {t.heraldAway(heraldDistance(expedition) ?? 0)}
                  </span>
                )}
              </span>
            </div>
          )}
          {expedition.tutorial && (
            <div className="meter meter-tight meter-tutorial" title={t.tutorialBadgeHint}>
              <span className="meter-label">{t.tutorialBadge}</span>
            </div>
          )}
          {expedition.darkening > 0 && (
            <div className="meter meter-tight meter-danger" title={t.darkeningHint}>
              <span className="meter-label">{t.darkening}</span>
              <span className="meter-value">{t.darkeningLevel(expedition.darkening)}</span>
            </div>
          )}
        </div>

        <div className="topbar-right">
          {!inMission && !expedition.pendingEncounter && (
            <nav className="nav">
              {NAV.map((entry) => (
                <button
                  key={entry.screen}
                  className={`nav-button ${screen === entry.screen ? 'on' : ''}`}
                  data-action="nav"
                  data-screen={entry.screen}
                  onClick={() => openScreen(entry.screen)}
                >
                  {t[entry.labelKey]}
                </button>
              ))}
            </nav>
          )}

          <div className="lang-switch" title={t.language}>
            {(['hu', 'en'] as Lang[]).map((code) => (
              <button
                key={code}
                className={`lang-button ${lang === code ? 'lang-button-on' : ''}`}
                data-action="setLang"
                data-lang={code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          {game.room?.mode === 'online' && (
            <span className={`net-badge net-${net.status.k}`} title={t.lobbyIntro}>
              {net.status.k === 'live'
                ? net.status.role === 'host'
                  ? t.netHosting(net.status.peers)
                  : t.netJoined
                : net.status.k === 'opening'
                  ? t.netOpening
                  : t.netLost}
            </span>
          )}

          <SoundButton on={sound} onToggle={toggleSound} />

          <button
            className="button button-help"
            data-action="openHelp"
            onClick={() => setHelpOpen(true)}
            title={t.helpTitle}
            aria-label={t.helpTitle}
          >
            ?
          </button>

          <button
            className="button"
            data-action="openDials"
            onClick={() => setDialsOpen(true)}
            title={t.dialsTitle}
            aria-label={t.dialsTitle}
          >
            ⚙
          </button>

          <button
            className="button button-danger"
            data-action="openWipe"
            onClick={() => setWipeOpen(true)}
            title={t.wipeTitle}
            aria-label={t.wipeTitle}
          >
            ⟲
          </button>
        </div>
      </header>

      <main className="body">
        {screen === 'ship' && <ShipView state={expedition} dispatch={dispatch} />}
        {screen === 'starmap' && <StarMapView state={expedition} dispatch={dispatch} />}
        {screen === 'research' && <ResearchView state={expedition} dispatch={dispatch} />}
        {screen === 'crew' && <ShipView state={expedition} dispatch={dispatch} />}
        {screen === 'consoles' && (
          <ConsoleView
            state={expedition}
            dispatch={dispatch}
            mine={game.room?.mode === 'online' ? myHeroes : []}
            names={heroNames}
          />
        )}
        {screen === 'gate' && <GateView state={expedition} dispatch={dispatch} />}
        {screen === 'market' && <MarketView state={expedition} dispatch={dispatch} />}
        {screen === 'encounter' && <EncounterView state={expedition} dispatch={dispatch} />}
        {screen === 'mission' && (
          <MissionView
            state={expedition}
            dispatch={dispatch}
            canUndo={canUndo}
            onUndo={undo}
            room={game.room}
            mySeats={mySeats}
          />
        )}
        {screen === 'heart' && <HeartView state={expedition} dispatch={dispatch} />}
        {screen === 'over' && <OverView state={expedition} onReturn={returnToArchive} />}
      </main>

      {!inMission && screen !== 'over' && (
        <footer className="weekbar">
          <button
            className="button button-primary"
            data-action="endWeek"
            disabled={!canAdvanceWeek(expedition)}
            onClick={() => dispatch({ k: 'advanceWeek' })}
            title={canAdvanceWeek(expedition) ? undefined : t.endWeekBlocked}
          >
            {t.endWeek}
          </button>

          {(() => {
            // Whose week is still undecided. A prompt rather than a block: the
            // week can always be ended, but nobody should end it by accident
            // while three people still have a decision open.
            const pending = expedition.heroes.filter(
              (hero) => !expedition.watch?.[hero.heroClass],
            ).length
            return pending > 0 ? (
              <span className="watch-pending">{t.watchPending(pending)}</span>
            ) : null
          })()}

          <div className="weeklog">
            {logLines.slice(0, 4).map((entry, i) => (
              <span key={i} className={`weeklog-line ${i === 0 ? 'fresh' : ''}`}>
                {describeExpeditionEvent(entry.event, lang)}
              </span>
            ))}
          </div>

          {/* Two very different things used to be one button. Stopping for the
              night and giving the expedition up were both reached through
              "Expedíció leállítása", so the only visible way out of a running
              game was the one that ended it — and a group that wanted to carry
              on next week had no way to say so. */}
          {expedition.tutorial ? (
            <button
              className="button"
              data-action="finishTutorial"
              onClick={() => {
                if (window.confirm(t.tutorialFinishConfirm)) {
                  setGuide(null)
                  setSession((current) => ({
                    ...current,
                    game: { ...current.game, expedition: null, room: null },
                    undo: [],
                    mark: null,
                    summary: null,
                  }))
                  setRooms(listRooms())
                  setShowArchive(true)
                }
              }}
            >
              {t.tutorialFinish}
            </button>
          ) : null}
          <button
            className="button"
            data-action="pauseExpedition"
            title={t.pauseHint}
            onClick={() => setShowArchive(true)}
          >
            {t.pauseExpedition}
          </button>
          {!expedition.tutorial && (
          <button
            className="button button-quiet"
            data-action="abandon"
            title={t.abandonHint}
            onClick={() => {
              if (window.confirm(t.abandonConfirm)) dispatch({ k: 'abandon' })
            }}
          >
            {t.abandonExpedition}
          </button>
          )}
        </footer>
      )}

      {/* Not during a landing. The walk lives in the bottom-right corner, which
          on the grid is where the hand of cards is — a panel that covers the
          cards is not an explanation, it is an obstacle. Its steps are about the
          ship's screens anyway, and it comes back when the party does. */}
      {guideStep !== null && !inMission && (
        <Guide
          step={guideStep}
          screen={screen}
          onStep={setGuide}
          onClose={() => setGuide(null)}
          onGo={openScreen}
        />
      )}

      {!inMission && (
        <aside className="logpanel">
          <h3>{t.logHeading}</h3>
          <div className="log">
            {logLines.map((entry, i) => (
              <div key={i} className="log-line">
                <span className="log-round">{entry.week}.</span>{' '}
                {describeExpeditionEvent(entry.event, lang)}
              </div>
            ))}
          </div>
        </aside>
      )}

      {expedition.proposal && (
        <div className="proposal" role="status">
          <div className="proposal-text">
            <strong>{t.proposalHeading}</strong>
            <span>
              {t.proposalAsked(
                seatLabel(game.room, expedition.proposal.by, lang),
                s(proposalLabel(expedition.proposal.action)),
              )}
            </span>
          </div>
          <div className="button-row">
            {mySeats.includes(expedition.proposal.by) ? (
              <button
                className="button button-small"
                data-action="dropProposal"
                onClick={() => dispatch({ k: 'dropProposal' })}
              >
                {t.proposalWithdraw}
              </button>
            ) : (
              <>
                <button
                  className="button button-primary button-small"
                  data-action="second"
                  onClick={() => dispatch({ k: 'second', by: mySeats[0] ?? 0 })}
                >
                  {t.proposalAgree}
                </button>
                <button
                  className="button button-small"
                  data-action="dropProposal"
                  onClick={() => dispatch({ k: 'dropProposal' })}
                >
                  {t.proposalRefuse}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {refused && (
        <div className="refused" role="status">
          {refused}
        </div>
      )}

      <a ref={downloadRef} hidden />
      {helpOpen && <Help topic={helpTopicFor(screen)} onClose={() => setHelpOpen(false)} />}
      {session.summary && <ChangeSummary summary={session.summary} onClose={closeSummary} />}
      {dialsOpen && expedition && (
        <DifficultyPanel
          dials={expedition.dials}
          hasPreset={hasPreset}
          onSet={(dial, level) => dispatch({ k: 'dialSet', dial, level })}
          onSavePreset={() => {
            saveDialPreset(expedition.dials)
            setHasPreset(true)
          }}
          onLoadPreset={() => {
            const preset = loadDialPreset()
            if (!preset) return
            for (const [dial, level] of Object.entries(preset)) {
              dispatch({ k: 'dialSet', dial: dial as DialId, level })
            }
          }}
          onReset={() => {
            for (const dial of DIALS) dispatch({ k: 'dialSet', dial: dial.id, level: DEFAULT_LEVEL })
          }}
          onClose={() => setDialsOpen(false)}
        />
      )}
      {wipeOpen && (
        <WipeDialog
          onCancel={() => setWipeOpen(false)}
          onConfirm={() => {
            setWipeOpen(false)
            wipeEverything()
          }}
        />
      )}
    </div>
  )
}

/**
 * The one dialog that asks whether you really mean it.
 *
 * Everything else in the game either has an undo or leaves a trace in the
 * Archive. This does neither: it takes the Archive too. So it says what it will
 * destroy, in words, and the destructive button is not the one under the cursor.
 */
function WipeDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang()
  return (
    <div className="wipe-veil" onClick={onCancel}>
      <div
        className="wipe"
        role="dialog"
        aria-modal
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{t.wipeHeading}</h2>
        <p>{t.wipeText}</p>
        <ul className="wipe-list">
          <li>{t.wipeItemExpedition}</li>
          <li>{t.wipeItemArchive}</li>
          <li>{t.wipeItemSave}</li>
          <li>{t.wipeItemRooms}</li>
        </ul>
        <p className="wipe-hint">{t.wipeHint}</p>
        <div className="button-row">
          <button className="button" data-action="cancelWipe" onClick={onCancel}>
            {t.cancel}
          </button>
          <button className="button button-danger" data-action="confirmWipe" onClick={onConfirm}>
            {t.wipeConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Which chapter of the rules is most useful from this screen. */
function helpTopicFor(screen: Screen): HelpTopic {
  switch (screen) {
    case 'starmap':
      return 'starmap'
    case 'mission':
      return 'mission'
    case 'heart':
    case 'gate':
    case 'over':
      return 'ending'
    case 'consoles':
      return 'consoles'
    default:
      return 'strategic'
  }
}

function TopBarSlim({
  lang,
  setLang,
  onHelp,
  onBack,
  sound,
  onToggleSound,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  onHelp: () => void
  onBack?: () => void
  sound: boolean
  onToggleSound: () => void
}) {
  const { t } = useLang()
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{t.appTitle}</h1>
        <span className="subtitle">{t.appSubtitle}</span>
      </div>
      <div className="topbar-right">
        {onBack && (
          <button className="button" data-action="backToExpedition" onClick={onBack}>
            {t.back}
          </button>
        )}
        <div className="lang-switch" title={t.language}>
          {(['hu', 'en'] as Lang[]).map((code) => (
            <button
              key={code}
              className={`lang-button ${lang === code ? 'lang-button-on' : ''}`}
              data-action="setLang"
              data-lang={code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <SoundButton on={sound} onToggle={onToggleSound} />
        <button
          className="button button-help"
          data-action="openHelp"
          onClick={onHelp}
          title={t.helpTitle}
          aria-label={t.helpTitle}
        >
          ?
        </button>
      </div>
    </header>
  )
}

/**
 * The only interface the sound layer needs: a switch.
 *
 * The glyph never changes — a struck-through note renders as a box in half the
 * fonts out there — so "off" is carried by the dimming and by the label.
 *
 * It is shown even when no audio files are present, because the player is the
 * one who decides whether to add them — and a switch that appears the moment
 * you drop in a file would be stranger than one that is always there.
 */
function SoundButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { t } = useLang()
  return (
    <button
      className={`button button-sound ${on ? '' : 'button-muted'}`}
      data-action="toggleSound"
      data-sound={on ? 'on' : 'off'}
      onClick={onToggle}
      title={t.soundTitle}
      aria-label={on ? t.soundOn : t.soundOff}
    >
      {'♪'}
    </button>
  )
}

/** Who a seat is, for a sentence about it. */
function seatLabel(room: GameState['room'], slot: number, lang: Lang): string {
  const seat = room?.seats.find((entry) => entry.slot === slot)
  if (!seat) return `#${slot}`
  return seat.name || pick(HERO_CLASSES[seat.heroClass].name, lang)
}
