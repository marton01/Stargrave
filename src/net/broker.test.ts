// Where the table meets.
//
// WebRTC connects two browsers directly, but they cannot find each other
// unaided: a signalling server holds the door open while they swap addresses,
// and then it is out of the conversation. No game data goes through it.
//
// By default that is PeerJS's free public one — which is why this game can be
// played over the internet from a static page with no backend at all, and also
// the one part of the system somebody else operates. It goes down, and plenty of
// networks block it: an ad-blocker, a DNS filter, a school or office firewall.
// One player's browser then fills with "WebSocket connection failed" while
// everybody else in the same group is fine.
//
// So the address is a setting, and what somebody pastes into it comes out of a
// terminal or a chat message rather than a spec. It has to be read forgivingly.

import { describe, expect, it } from 'vitest'
import { brokerOptions, brokerProblem } from './broker'

describe('the address somebody pasted', () => {
  it('means the default when it is empty', () => {
    expect(brokerOptions('')).toBeUndefined()
    expect(brokerOptions('   ')).toBeUndefined()
  })

  it('takes a bare host as a secure server on 443', () => {
    expect(brokerOptions('peerjs.example.com')).toEqual({
      host: 'peerjs.example.com',
      port: 443,
      path: '/',
      secure: true,
      key: 'peerjs',
    })
  })

  it('does not mind an https prefix, because people paste urls', () => {
    expect(brokerOptions('https://peerjs.example.com')).toEqual(
      brokerOptions('peerjs.example.com'),
    )
  })

  it('takes a port when one is given', () => {
    expect(brokerOptions('peerjs.example.com:9000')?.port).toBe(9000)
  })

  it('takes a path, and always ends it with a slash', () => {
    // PeerJS builds its url by concatenation: a path without the trailing slash
    // produces `/myappperjs`, which fails with no useful error anywhere.
    expect(brokerOptions('peerjs.example.com/myapp')?.path).toBe('/myapp/')
    expect(brokerOptions('peerjs.example.com/myapp/')?.path).toBe('/myapp/')
  })

  it('reads http as an insecure server, which is what a home LAN gives you', () => {
    // `npx peerjs --port 9000` is plain http, and a group on one wifi is exactly
    // who needs a server of their own most.
    expect(brokerOptions('http://192.168.1.7:9000')).toEqual({
      host: '192.168.1.7',
      port: 9000,
      path: '/',
      secure: false,
      key: 'peerjs',
    })
  })

  it('defaults an insecure address to port 80, not 443', () => {
    expect(brokerOptions('http://peerjs.example.com')?.port).toBe(80)
  })

  it('refuses nonsense rather than half-configuring the network', () => {
    expect(brokerOptions(':9000')).toBeUndefined()
    expect(brokerOptions('peerjs.example.com:notaport')).toBeUndefined()
  })
})

describe('an address that cannot be looked up', () => {
  // One evening was lost to this. A player who had been told they might need a
  // tunnel pasted the TUNNEL'S ID into the address box — a bare uuid, with no
  // colon and no slash, which passed every check there was. The game then opened
  // sockets to `wss://1212d1bd-61d0-.../peerjs` all evening and reported
  // ERR_NAME_NOT_RESOLVED, which tells a player nothing whatsoever.
  it('refuses a bare identifier, so the game falls back to the default', () => {
    expect(brokerOptions('1212d1bd-61d0-41bb-b099-fd4771c8f6e3')).toBeUndefined()
    expect(brokerProblem('1212d1bd-61d0-41bb-b099-fd4771c8f6e3')).toBe('host')
  })

  it('refuses anything else without a dot in it', () => {
    for (const bad of ['peerjs', 'my-server', 'valami', 'PeerServer']) {
      expect(brokerOptions(bad), bad).toBeUndefined()
    }
  })

  it('accepts what a real address looks like', () => {
    for (const good of [
      'peerjs.example.com',
      'https://peerjs.example.com',
      'peerjs.example.com:9000',
      'http://192.168.1.7:9000/myapp',
      'localhost:9000',
      'something.trycloudflare.com',
    ]) {
      expect(brokerOptions(good), good).toBeDefined()
    }
  })

  it('says nothing is wrong when nothing is set', () => {
    expect(brokerProblem('')).toBeNull()
    expect(brokerProblem('   ')).toBeNull()
  })

  it('tells a bad port apart from a bad host', () => {
    expect(brokerProblem('peerjs.example.com:0')).toBe('port')
    expect(brokerProblem('peerjs.example.com:999999')).toBe('port')
    expect(brokerProblem('nodots:9000')).toBe('host')
  })

  it('refuses a name with empty labels in it', () => {
    for (const bad of ['.example.com', 'example.com.', 'a..b.com']) {
      expect(brokerOptions(bad), bad).toBeUndefined()
    }
  })
})
