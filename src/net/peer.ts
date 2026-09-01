// The pipe. Everything interesting is next door in protocol.ts.
//
// PeerJS gives two things: a public signalling broker that introduces two
// browsers to each other, and a WebRTC data channel once they are introduced.
// After the introduction nothing goes through anybody's server — the players are
// talking directly to each other — which is what lets this game stay a static
// site on GitHub Pages and still be played by four people in four houses.
//
// The one structural decision here: the peer id IS the room code. Whoever opens
// a code and finds nobody home becomes the host; everybody else finds them. So
// the host is not a person, it is a chair — if the host closes their laptop, the
// next person to open the code takes over and seeds the room from their own
// saved copy. Nobody owns the game.

import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import { peerIdFor } from './protocol'
import type { NetMessage } from './protocol'

export type NetRole = 'host' | 'guest'

export type NetStatus =
  | { k: 'off' }
  | { k: 'opening' }
  | { k: 'live'; role: NetRole; peers: number }
  | { k: 'lost'; reason: string }

export type NetHandlers = {
  /** A message arrived. `from` is the connection id, for host-side replies. */
  onMessage: (message: NetMessage, from: string) => void
  onStatus: (status: NetStatus) => void
  /** A guest connected (host only). Its id, so a snapshot can be sent to it. */
  onJoin?: (from: string) => void
  onLeave?: (from: string) => void
}

export type Transport = {
  role: NetRole
  /** To everybody. */
  broadcast: (message: NetMessage) => void
  /** To one connection — or, from a guest, to the host regardless of `to`. */
  send: (to: string, message: NetMessage) => void
  close: () => void
}

/**
 * Open a room, as host if the code is free and as guest if it is not.
 *
 * The race is real and harmless: if two people open the same code within a
 * second of each other, one of them wins the id and the other is told the id is
 * taken, waits, and connects to the winner. Which is exactly the behaviour you
 * want from "whoever gets there first is the host".
 */
export function openRoom(code: string, handlers: NetHandlers): Promise<Transport> {
  const id = peerIdFor(code)
  handlers.onStatus({ k: 'opening' })

  return new Promise((resolve) => {
    const peer = new Peer(id)
    const connections = new Map<string, DataConnection>()
    let settled = false

    /**
     * Send, even if the channel is a moment away from being open.
     *
     * The host answers a guest's hello the instant it arrives — and that can be
     * a tick before the host's own end of the channel reports itself open, in
     * which case a plain `send` is silently dropped and the guest sits in an
     * empty-looking lobby forever. Waiting for the open event costs nothing and
     * removes the whole class of "the first message never arrives".
     */
    const safeSend = (conn: DataConnection, message: NetMessage) => {
      if (conn.open) conn.send(message)
      else conn.once('open', () => conn.send(message))
    }

    const wire = (conn: DataConnection) => {
      connections.set(conn.connectionId, conn)
      conn.on('data', (data) => {
        handlers.onMessage(data as NetMessage, conn.connectionId)
      })
      conn.on('close', () => {
        connections.delete(conn.connectionId)
        handlers.onLeave?.(conn.connectionId)
        handlers.onStatus({ k: 'live', role: 'host', peers: connections.size })
      })
    }

    peer.on('open', () => {
      // Nobody had the code: this machine is the host.
      peer.on('connection', (conn) => {
        // The data handler goes on NOW, not inside `open`. A guest sends its
        // hello the instant its own channel opens, and the two opens are not
        // synchronised: attaching the listener a tick later loses that first
        // message, which is the one that says who has just arrived. It cost an
        // afternoon of "the host cannot see me" to find.
        wire(conn)
        conn.on('open', () => {
          handlers.onJoin?.(conn.connectionId)
          handlers.onStatus({ k: 'live', role: 'host', peers: connections.size })
        })
      })
      handlers.onStatus({ k: 'live', role: 'host', peers: 0 })
      if (settled) return
      settled = true
      resolve({
        role: 'host',
        broadcast: (message) => {
          for (const conn of connections.values()) safeSend(conn, message)
        },
        send: (to, message) => {
          const conn = connections.get(to)
          if (conn) safeSend(conn, message)
        },
        close: () => {
          for (const conn of connections.values()) conn.close()
          peer.destroy()
          handlers.onStatus({ k: 'off' })
        },
      })
    })

    peer.on('error', (error: { type?: string; message?: string }) => {
      // The id is taken, so somebody is already hosting: go and join them.
      if (error?.type === 'unavailable-id' && !settled) {
        settled = true
        peer.destroy()
        joinRoom(code, handlers).then(resolve)
        return
      }
      if (!settled) {
        settled = true
        handlers.onStatus({ k: 'lost', reason: error?.type ?? 'error' })
        // A transport that does nothing, so the caller never has to null-check.
        resolve(deadTransport('host'))
        return
      }
      handlers.onStatus({ k: 'lost', reason: error?.type ?? 'error' })
    })
  })
}

/** Connect to whoever is hosting this code. */
function joinRoom(code: string, handlers: NetHandlers): Promise<Transport> {
  return new Promise((resolve) => {
    // No id of our own: the broker hands out a random one for guests.
    const peer = new Peer()
    let settled = false

    peer.on('open', () => {
      const conn = peer.connect(peerIdFor(code), { reliable: true })

      conn.on('open', () => {
        handlers.onStatus({ k: 'live', role: 'guest', peers: 1 })
        if (settled) return
        settled = true
        const send = (message: NetMessage) => {
          if (conn.open) conn.send(message)
          else conn.once('open', () => conn.send(message))
        }
        resolve({
          role: 'guest',
          broadcast: send,
          send: (_to, message) => send(message),
          close: () => {
            conn.close()
            peer.destroy()
            handlers.onStatus({ k: 'off' })
          },
        })
      })

      conn.on('data', (data) => handlers.onMessage(data as NetMessage, 'host'))
      conn.on('close', () => handlers.onStatus({ k: 'lost', reason: 'closed' }))
      conn.on('error', () => handlers.onStatus({ k: 'lost', reason: 'connection' }))
    })

    peer.on('error', (error: { type?: string }) => {
      handlers.onStatus({ k: 'lost', reason: error?.type ?? 'error' })
      if (!settled) {
        settled = true
        resolve(deadTransport('guest'))
      }
    })
  })
}

/**
 * A transport that goes nowhere.
 *
 * Returned instead of throwing when the broker cannot be reached, so that a game
 * whose network failed is still a playable game rather than a blank screen: the
 * status line says what happened and the expedition carries on locally.
 */
function deadTransport(role: NetRole): Transport {
  return {
    role,
    broadcast: () => {},
    send: () => {},
    close: () => {},
  }
}
