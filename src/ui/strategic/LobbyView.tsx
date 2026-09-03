// The room before the expedition: a code, four chairs and a key.
//
// Three things are on this screen and each one answers a question somebody will
// ask out loud within the first minute of trying to play together.
//
// "How do the others get in?" — the code, big, in fours, with a copy button.
// "Which one am I?" — the seats, with names, and yours marked.
// "What happens when I close the tab?" — your player key, shown rather than
// hidden, because it is the one thing that cannot be recovered from the others.
// A browser can be wiped; if the key was written down anywhere, the chair is
// still yours when you come back.

import { useEffect, useState } from 'react'
import { HERO_CLASSES } from '../../content/heroes'
import { HERO_ORDER } from '../../engine/expedition/expedition'
import type { HeroClassId } from '../../engine/types'
import {
  ROOM_NAME_MAX,
  formatRoomCode,
  freeSeats,
  keyTag,
  roomIsSeated,
} from '../../engine/session/room'
import type { PlayerIdentity, RoomState } from '../../engine/session/room'
import type { NetStatus } from '../../net/peer'
import { buildLabel } from '../../version'
import { useLang } from '../../i18n/LangContext'
import {
  DEFAULT_BROKER,
  brokerHost,
  clearCooldown,
  cooldownLeft,
  brokerIsInsecureFromHttps,
  brokerProblem,
  probeBroker,
  setBrokerHost,
} from '../../net/broker'
import type { BrokerProbe } from '../../net/broker'

export function LobbyView({
  room,
  identity,
  status,
  isHost,
  onName,
  onSit,
  onStand,
  onPick,
  onBegin,
  onPlayLocally,
  onLeave,
  onClose,
  onRename,
}: {
  room: RoomState
  identity: PlayerIdentity
  status: NetStatus
  isHost: boolean
  onName: (name: string) => void
  onSit: (slot?: number) => void
  onStand: (slot: number) => void
  onPick: (slot: number, heroClass: HeroClassId) => void
  onBegin: () => void
  /** Give up on the network and carry on as a hotseat game. */
  onPlayLocally: () => void
  onLeave: () => void
  /** Host only: end the room for everybody in it. */
  onClose: () => void
  /** Give the run a name the whole table sees. */
  onRename: (name: string) => void
}) {
  const { t, s } = useLang()
  const tag = keyTag(identity.key)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<'code' | 'key' | null>(null)
  const mine = room.seats.filter((seat) => seat.claimedBy === tag)
  const seated = roomIsSeated(room)
  // Nothing about the seating means anything until there is a line to the
  // others: a chair taken offline is taken in this browser and nowhere else.
  /**
   * Whether anything a player does here means anything yet.
   *
   * It used to be simply "is there a line", and that made a network failure into
   * a locked door: a player whose browser cannot open a websocket could not take
   * a chair in their OWN room, could not pick a hero, could not start — nothing,
   * with no way forward at all.
   *
   * But the person who opened the room is the authority on it. They can sit
   * down, choose, and set out with no connection whatsoever; the line is what
   * lets OTHERS join them, and their copy is the one everybody else is sent when
   * it does come up. Only a guest genuinely has to wait, because a seat a guest
   * claims offline is claimed in that browser alone and the host's snapshot
   * takes it away again a second later.
   */
  const connected = status.k === 'live'
  const isRoomOwner = room.hostKey === tag
  const canAct = connected || isRoomOwner

  const copy = (text: string, what: 'code' | 'key') => {
    navigator.clipboard?.writeText(text).then(
      () => setCopied(what),
      () => setCopied(null),
    )
  }

  return (
    <div className="lobby">
      <section className="panel">
        <header className="panel-head">
          <h2>{t.lobbyHeading}</h2>
          <span className={`panel-meta net-${status.k}`}>{netLabel(status, t)}</span>
        </header>
        <p className="panel-intro">{t.lobbyIntro}</p>

        {/* When the line will not come up, the ONE thing that matters is which
            part failed. The console fills with hundreds of "WebSocket connection
            failed" and the lobby used to say only "the line dropped", which
            sounds like the other player's fault and is not. */}
        {status.k === 'lost' && <BrokerTrouble onPlayLocally={onPlayLocally} />}
        <Cooldown />

        <div className="lobby-code">
          <span className="lobby-code-label">{t.roomCode}</span>
          <strong className="lobby-code-value" data-code={room.code}>
            {formatRoomCode(room.code)}
          </strong>
          <button className="button button-small" data-action="copyCode" onClick={() => copy(formatRoomCode(room.code), 'code')}>
            {copied === 'code' ? t.copied : t.copy}
          </button>
        </div>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h3>{t.seatsHeading}</h3>
          <span className="panel-meta">{t.seatsFree(freeSeats(room).length)}</span>
        </header>

        {/* What this run is called. It is the first thing the list of games you
            can carry on with will show, and without it that list is a column of
            eight-character codes. */}
        <label className="setting lobby-name">
          {t.roomName}
          <input
            type="text"
            data-action="renameRoom"
            value={room.name}
            placeholder={t.roomNamePlaceholder}
            onChange={(event) => onRename(event.target.value)}
            maxLength={ROOM_NAME_MAX}
            size={22}
          />
        </label>

        <label className="setting lobby-name">
          {t.yourName}
          <input
            type="text"
            data-action="setName"
            value={identity.name}
            placeholder={t.yourNamePlaceholder}
            onChange={(event) => onName(event.target.value)}
            size={16}
          />
        </label>

        <div className="seat-list">
          {room.seats.map((seat) => {
            const isMine = seat.claimedBy === tag
            return (
              <div
                key={seat.slot}
                className={`seat ${isMine ? 'seat-mine' : ''} ${seat.claimedBy ? '' : 'seat-free'}`}
                data-seat={seat.slot}
              >
                <div className="seat-text">
                  {/*
                    Who plays whom is a decision, not a dealing order — and it is
                    the first thing anybody asks. Picking a hero somebody else has
                    trades with them, so the table can never end up with two
                    Runesmiths.
                  */}
                  <select
                    className="seat-hero"
                    data-action="pickHero"
                    data-seat={seat.slot}
                    value={seat.heroClass}
                    disabled={!canAct || !(isMine || room.hostKey === tag)}
                    onChange={(event) => onPick(seat.slot, event.target.value as HeroClassId)}
                  >
                    {HERO_ORDER.map((id) => (
                      <option key={id} value={id}>
                        {s(HERO_CLASSES[id].name)}
                      </option>
                    ))}
                  </select>
                  <span className="seat-who">
                    {seat.claimedBy ? seat.name || t.seatUnnamed : t.seatEmpty}
                    {isMine && ` — ${t.seatYou}`}
                  </span>
                  <span className="seat-role">{s(HERO_CLASSES[seat.heroClass].description)}</span>
                </div>
                {seat.claimedBy === null ? (
                  <button
                    className="button button-primary button-small"
                    data-action="sit"
                    data-seat={seat.slot}
                    disabled={!canAct}
                    title={canAct ? undefined : t.netOpening}
                    onClick={() => onSit(seat.slot)}
                  >
                    {canAct ? t.seatSit : t.netOpening}
                  </button>
                ) : isMine || room.hostKey === tag ? (
                  <button
                    className="button button-small"
                    data-action="stand"
                    data-seat={seat.slot}
                    disabled={!connected}
                    onClick={() => onStand(seat.slot)}
                  >
                    {isMine ? t.seatStand : t.seatFree}
                  </button>
                ) : (
                  <span className="muted">{t.seatTaken}</span>
                )}
              </div>
            )
          })}
        </div>

        {mine.length === 0 && <p className="lobby-warning">{t.seatNoneYours}</p>}
      </section>

      <section className="panel">
        <header className="panel-head">
          <h3>{t.playerKeyHeading}</h3>
        </header>
        <p className="panel-intro">{t.playerKeyIntro}</p>
        <div className="lobby-code">
          <strong className="lobby-key-value">
            {showKey ? identity.key : '••••••••••••••'}
          </strong>
          <button className="button button-small" data-action="showKey" onClick={() => setShowKey(!showKey)}>
            {showKey ? t.playerKeyHide : t.playerKeyShow}
          </button>
          <button className="button button-small" data-action="copyKey" onClick={() => copy(identity.key, 'key')}>
            {copied === 'key' ? t.copied : t.copy}
          </button>
        </div>
      </section>

      <div className="button-row">
        {isHost ? (
          <button
            className="button button-primary"
            data-action="beginExpedition"
            disabled={!seated || !canAct}
            title={seated ? undefined : t.lobbyWaiting}
            onClick={onBegin}
          >
            {seated ? t.lobbyBegin : t.lobbyWaiting}
          </button>
        ) : (
          <span className="muted">{t.lobbyGuestWait}</span>
        )}
        <button className="button" data-action="leaveRoom" onClick={onLeave}>
          {t.lobbyLeave}
        </button>
        {/* Only whoever opened the room, because closing it means letting go of
            the address, and they are the one holding it. */}
        {isRoomOwner && (
          <button
            className="button button-quiet"
            data-action="closeRoom"
            title={t.lobbyCloseTitle}
            onClick={() => {
              if (confirm(t.lobbyCloseConfirm)) onClose()
            }}
          >
            {t.lobbyClose}
          </button>
        )}
      </div>

      {/* Leaving looked final, because nothing on the way out said otherwise. */}
      <p className="panel-note">{t.lobbyLeaveNote}</p>
      <div className="button-row">
      </div>
    </div>
  )
}

/** The connection, in one word, because it is the first thing anybody looks at. */
function netLabel(status: NetStatus, t: ReturnType<typeof useLang>['t']): string {
  switch (status.k) {
    case 'off':
      return t.netOff
    case 'opening':
      return t.netOpening
    case 'live':
      return status.role === 'host' ? t.netHosting(status.peers) : t.netJoined
    case 'lost':
      return t.netLost
  }
}

/**
 * What to do when the signalling server cannot be reached.
 *
 * This is the failure that costs an evening, and it is invisible from inside the
 * game unless the game says it out loud: the service that introduces two
 * browsers to each other is somebody else's, it is free, and plenty of networks
 * block it. Everything here exists so that a player can tell in ten seconds
 * whether the problem is the game, their network, or the server — and then do
 * something about it.
 */
function BrokerTrouble({ onPlayLocally }: { onPlayLocally: () => void }) {
  const { t } = useLang()
  const [host, setHost] = useState(brokerHost())
  const [saved, setSaved] = useState(false)
  const problem = brokerProblem(host)
  // What will actually be dialled. A refused setting falls back to the default,
  // and saying otherwise is how an evening gets lost to a box nobody doubted.
  const shown = problem || !host.trim() ? DEFAULT_BROKER : host.trim()

  const save = (next: string) => {
    setHost(next)
    setBrokerHost(next)
    setSaved(true)
  }

  return (
    <div className="net-trouble">
      <p>{t.netBrokerDown(shown)}</p>
      <ConnectionProbe host={host} />
      {/* In a bug report this is the first thing worth knowing. */}
      <p className="panel-note">
        {t.buildLabel} {buildLabel()}
      </p>

      <label className="setting">
        {t.netBrokerHeading}
        <input
          type="text"
          data-action="setBroker"
          value={host}
          placeholder={t.netBrokerPlaceholder}
          onChange={(event) => save(event.target.value)}
          size={26}
        />
      </label>
      <p className="panel-note">{t.netBrokerIntro}</p>
      {problem === 'host' && <p className="net-warning">{t.netBrokerBadHost}</p>}
      {problem === 'port' && <p className="net-warning">{t.netBrokerBadPort}</p>}
      {brokerIsInsecureFromHttps(host) && <p className="net-warning">{t.netBrokerInsecure}</p>}
      {saved && <p className="panel-note">{t.netBrokerSaved}</p>}
      <div className="net-trouble-actions">
        {host.trim() !== '' && (
          <button className="button button-small" data-action="resetBroker" onClick={() => save('')}>
            {t.netBrokerReset}
          </button>
        )}
        {/* The evening does not have to end because somebody's ISP dislikes a
            domain. The room code carries the seed, so the same galaxy opens as a
            hotseat game on whichever machine can see everybody's faces. */}
        <button className="button button-small" data-action="playLocally" onClick={onPlayLocally}>
          {t.netPlayLocally}
        </button>
      </div>
      <p className="panel-note">{t.netPlayLocallyHint}</p>
    </div>
  )
}

/**
 * Which of the two layers is failing.
 *
 * The first version of this was a link to the broker's `/id` endpoint, and it
 * was worse than nothing: that is ordinary https, the game needs a websocket,
 * and a player whose sockets were being killed opened the link, got a perfectly
 * good id back, and concluded the game was lying to them.
 *
 * So it tests both, separately, and says which one broke. https through and the
 * socket blocked is not a vague network problem — it is a short list, and every
 * item on it has a fix.
 */
function ConnectionProbe({ host }: { host: string }) {
  const { t } = useLang()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BrokerProbe | null>(null)

  const run = () => {
    setBusy(true)
    setResult(null)
    void probeBroker(host).then((probe) => {
      setResult(probe)
      setBusy(false)
    })
  }

  const verdict = !result
    ? null
    : result.http && result.ws
      ? t.netProbeVerdictOk
      : result.http && !result.ws
        ? t.netProbeVerdictWs
        : !result.http && result.ws
          ? t.netProbeVerdictOdd
          : t.netProbeVerdictAll

  return (
    <div className="probe">
      <button className="button button-small" data-action="probeBroker" disabled={busy} onClick={run}>
        {busy ? t.netBrokerTesting : t.netBrokerTest}
      </button>
      {result && (
        <>
          <ul className="probe-rows">
            <li>
              <span>{t.netProbeHttp}</span>
              <strong className={result.http ? 'probe-ok' : 'probe-bad'}>
                {result.http ? t.netProbeOk : t.netProbeFail}
              </strong>
            </li>
            <li>
              <span>{t.netProbeWs}</span>
              <strong className={result.ws ? 'probe-ok' : 'probe-bad'}>
                {result.ws ? t.netProbeOk : t.netProbeFail}
              </strong>
            </li>
          </ul>
          <p>{verdict}</p>
        </>
      )}
    </div>
  )
}

/**
 * We are deliberately not trying, and for how much longer.
 *
 * The public broker bans an address that knocks too often — Cloudflare's Error
 * 1015 — and this game used to knock every two and a half seconds for ever, from
 * the title screen, on a room nobody had asked to rejoin. Some households earned
 * a ban that way. Backing off only helps if it survives a reload, and a silence
 * nobody explains looks exactly like a broken game, so it says so.
 */
function Cooldown() {
  const { t } = useLang()
  const [left, setLeft] = useState(cooldownLeft())

  useEffect(() => {
    if (left <= 0) return
    const timer = window.setInterval(() => setLeft(cooldownLeft()), 5000)
    return () => window.clearInterval(timer)
  }, [left])

  if (left <= 0) return null
  return (
    <div className="net-trouble">
      <strong>{t.netCooldownHeading}</strong>
      <p>{t.netCooldown(Math.ceil(left / 60000))}</p>
      <button
        className="button button-small"
        data-action="skipCooldown"
        onClick={() => {
          clearCooldown()
          setLeft(0)
        }}
      >
        {t.netCooldownSkip}
      </button>
    </div>
  )
}
