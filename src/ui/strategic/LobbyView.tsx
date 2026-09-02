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

import { useState } from 'react'
import { HERO_CLASSES } from '../../content/heroes'
import { HERO_ORDER } from '../../engine/expedition/expedition'
import type { HeroClassId } from '../../engine/types'
import { formatRoomCode, freeSeats, keyTag, roomIsSeated } from '../../engine/session/room'
import type { PlayerIdentity, RoomState } from '../../engine/session/room'
import type { NetStatus } from '../../net/peer'
import { useLang } from '../../i18n/LangContext'
import {
  DEFAULT_BROKER,
  brokerHost,
  brokerIsInsecureFromHttps,
  brokerOptions,
  setBrokerHost,
} from '../../net/broker'

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
}) {
  const { t, s } = useLang()
  const tag = keyTag(identity.key)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState<'code' | 'key' | null>(null)
  const mine = room.seats.filter((seat) => seat.claimedBy === tag)
  const seated = roomIsSeated(room)
  // Nothing about the seating means anything until there is a line to the
  // others: a chair taken offline is taken in this browser and nowhere else.
  const connected = status.k === 'live'

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
                    disabled={!connected || !(isMine || room.hostKey === tag)}
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
                    disabled={!connected}
                    title={connected ? undefined : t.netOpening}
                    onClick={() => onSit(seat.slot)}
                  >
                    {connected ? t.seatSit : t.netOpening}
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
            disabled={!seated || !connected}
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
  const shown = host.trim() || DEFAULT_BROKER
  const options = brokerOptions(host)
  const testUrl = options
    ? `${options.secure ? 'https' : 'http'}://${options.host}:${options.port}${options.path}peerjs/id?key=peerjs`
    : `https://${DEFAULT_BROKER}/peerjs/id?key=peerjs`

  const save = (next: string) => {
    setHost(next)
    setBrokerHost(next)
    setSaved(true)
  }

  return (
    <div className="net-trouble">
      <p>{t.netBrokerDown(shown)}</p>
      <p>
        <a href={testUrl} target="_blank" rel="noreferrer">
          {t.netBrokerTest}
        </a>
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
