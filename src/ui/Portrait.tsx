// An optional portrait.
//
// Renders nothing at all until the file is actually there, which is why it can
// be sprinkled through the interface without leaving holes: the drawn shapes and
// the coloured name are the real identity of a unit, and the picture is a bonus.
//
// A thumbnail is 44 pixels, which is enough to know who it is and not enough to
// look at. So the picture under the cursor is shown at its full 256 — the size
// the file is asked for — next to the thumbnail it belongs to.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useOptionalImage } from './assets'

const PREVIEW = 256
const GAP = 12

export function Portrait({ path, className }: { path: string; className?: string }) {
  const url = useOptionalImage(path)
  const [at, setAt] = useState<{ left: number; top: number } | null>(null)
  if (!url) return null

  /**
   * Where the preview goes: to the left of the thumbnail if there is room,
   * otherwise to its right, and never off the top or bottom of the window.
   *
   * Left first because every portrait in the game sits in a panel on the right
   * — the sidebar in a battle, the crew list on the ship — so the picture opens
   * into the empty middle of the screen instead of over the edge.
   */
  function show(event: React.MouseEvent<HTMLImageElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const toTheLeft = box.left - PREVIEW - GAP
    setAt({
      left: toTheLeft >= GAP ? toTheLeft : Math.min(box.right + GAP, window.innerWidth - PREVIEW - GAP),
      top: Math.max(GAP, Math.min(box.top + box.height / 2 - PREVIEW / 2, window.innerHeight - PREVIEW - GAP)),
    })
  }

  return (
    <>
      <img
        className={`portrait ${className ?? ''}`.trim()}
        src={url}
        alt=""
        aria-hidden
        onMouseEnter={show}
        onMouseLeave={() => setAt(null)}
      />
      {at &&
        // Into `body`, not in place: `.app` is zoomed, and a `position: fixed`
        // element inside a zoomed box is scaled along with it, which would put
        // the preview next to nothing in particular.
        createPortal(
          <img className="portrait-preview" src={url} alt="" aria-hidden style={{ left: at.left, top: at.top }} />,
          document.body,
        )}
    </>
  )
}
