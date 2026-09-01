// Grid colours and their meanings.
//
// A separate file because the live legend in the help panel uses exactly these
// values — that way the help can never drift from what the player actually sees.

import type { HeroClassId, TerrainKind } from '../engine/types'
import type { UiKey } from '../i18n/ui'

export const TILE = 64

/**
 * Terrain colours. Contrast is the point: you must be able to tell at a glance
 * where you can walk and where you cannot. Walls should read as solid mass and
 * floors as open space — otherwise the tactical decision is made blind.
 */
export const TERRAIN_COLOR: Record<TerrainKind, string> = {
  floor: '#1d2736',
  ash: '#2c2a25',
  wall: '#04060a',
  chasm: '#000205',
  pillar: '#131b26',
}

/** Grid lines only on walkable tiles — that is what makes room shapes readable. */
export const GRID_LINE: Partial<Record<TerrainKind, string>> = {
  floor: 'rgba(150,175,210,0.13)',
  ash: 'rgba(190,175,150,0.15)',
  pillar: 'rgba(150,175,210,0.10)',
}

/** Which interface strings name and explain each terrain kind. */
export const TERRAIN_TEXT: Record<TerrainKind, { name: UiKey; text: UiKey }> = {
  floor: { name: 'terrainFloor', text: 'terrainFloorText' },
  ash: { name: 'terrainAsh', text: 'terrainAshText' },
  wall: { name: 'terrainWall', text: 'terrainWallText' },
  chasm: { name: 'terrainChasm', text: 'terrainChasmText' },
  pillar: { name: 'terrainPillar', text: 'terrainPillarText' },
}

/**
 * One colour per hero class, and one per enemy type.
 *
 * These live here for the reason the whole file exists: the board, the help
 * legend and the cards all read from this one place, so a hero cannot be amber
 * on the grid and cyan in the legend.
 *
 * There used to be two hero colours for four classes — the Runeweaver amber and
 * everybody else cyan — which made half of a four-hero party the same colour and
 * undid the point of a player owning a hero. The enemies were one red for the
 * same reason, and once a unit can be drawn as dark portrait art at forty
 * pixels, the ring around it is doing the work the silhouette used to do: it has
 * to say which enemy this is. All four enemy colours stay inside the danger
 * red's family — they must read as "the other side" first.
 */
export const HERO_COLOR: Record<HeroClassId, string> = {
  runesmith: 'var(--rune)',
  echoreader: 'var(--echo)',
  cantor: 'var(--rite)',
  surveyor: 'var(--astro)',
}

export const ENEMY_COLOR: Record<string, string> = {
  'ash-husk': '#c8563f',
  'rune-sentinel': '#d08a3e',
  'choir-wraith': '#b1568c',
  'godmachine-shard': '#9a5a4a',
}

/** The text tone that matches each hero's colour. See `.tone-*` in styles.css. */
export const HERO_TONE: Record<HeroClassId, string> = {
  runesmith: 'tone-rune',
  echoreader: 'tone-echo',
  cantor: 'tone-rite',
  surveyor: 'tone-astro',
}
