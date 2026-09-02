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
import { brokerOptions } from './broker'

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
