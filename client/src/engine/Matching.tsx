// Renderer for the `matching` primitive: connect each left item to a right item.
// Used by the Status-code zone (Z6). Interaction is click-to-pair (select a left
// item, then click a right item) — more robust on touch and GitHub Pages than
// drawing drag-lines, and fully keyboard-accessible.

import { useEffect, useState } from 'react'
import type { MatchItem } from './types'

interface MatchingProps {
  left: MatchItem[]
  right: MatchItem[]
  /** column headers — supplied by the level so the engine stays topic-agnostic */
  leftTitle?: string
  rightTitle?: string
  resetKey: string
  locked?: boolean
  /** reports the current mapping leftId -> rightId */
  onChange: (pairs: Record<string, string>) => void
}

export function Matching({ left, right, leftTitle, rightTitle, resetKey, locked, onChange }: MatchingProps) {
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [activeLeft, setActiveLeft] = useState<string | null>(null)
  // Display the right column in a shuffled order so codes never line up with the
  // left rows (otherwise the answer is just "match row 1 to row 1"). Computed
  // once per mount; the level is remounted per id, so each replay reshuffles.
  const [displayRight] = useState(() => shuffleDistinct(right))

  useEffect(() => {
    setPairs({})
    setActiveLeft(null)
    onChange({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // map rightId -> leftId for "what's already taken" display
  const takenBy: Record<string, string> = {}
  for (const [l, r] of Object.entries(pairs)) takenBy[r] = l

  function pickLeft(id: string) {
    if (locked) return
    setActiveLeft((cur) => (cur === id ? null : id))
  }

  function pickRight(rightId: string) {
    if (locked || !activeLeft) return
    setPairs((cur) => {
      const next = { ...cur }
      // a right item can only belong to one left — release any prior owner
      for (const [l, r] of Object.entries(next)) if (r === rightId) delete next[l]
      next[activeLeft] = rightId
      onChange(next)
      return next
    })
    setActiveLeft(null)
  }

  // a stable 1-based connection number per left item, so a helper and the code
  // it's paired to can show the *same* marker — reads as a connection without
  // relying on the two columns lining up by row
  const numberOf = (leftId: string) => left.findIndex((l) => l.id === leftId) + 1

  return (
    <div className="matching">
      <div className="matching__head">{leftTitle ?? 'Item'}</div>
      <div className="matching__head matching__head--right">{rightTitle ?? 'Match'}</div>

      <ul className="matching__col">
        {left.map((item) => {
          const paired = pairs[item.id]
          const n = numberOf(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={locked}
                className={`card card--left${activeLeft === item.id ? ' card--active' : ''}${
                  paired ? ' card--paired' : ''
                }`}
                onClick={() => pickLeft(item.id)}
              >
                <span className="card__main">
                  <span className="card__label">{item.label}</span>
                  {item.note && <span className="card__note">{item.note}</span>}
                </span>
                <span className={`conn${paired ? ' conn--on' : ''}`}>{n}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <ul className="matching__col">
        {displayRight.map((item) => {
          const owner = takenBy[item.id]
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={locked || !activeLeft}
                className={`card card--right${owner ? ' card--paired' : ''}`}
                onClick={() => pickRight(item.id)}
              >
                <span className={`conn${owner ? ' conn--on' : ' conn--ghost'}`}>
                  {owner ? numberOf(owner) : ''}
                </span>
                <span className="card__code">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="matching__hint">
        {locked
          ? ''
          : activeLeft
            ? 'Now pick its match on the right →'
            : 'Click a helper on the left to start a connection.'}
      </p>
    </div>
  )
}

/** Fisher–Yates shuffle that avoids returning the original order (so the right
 *  column never accidentally lines up with the left). */
function shuffleDistinct<T extends { id: string }>(items: T[]): T[] {
  if (items.length < 2) return [...items]
  const original = items.map((i) => i.id).join()
  let out = [...items]
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    if (out.map((i) => i.id).join() !== original) return out
  }
  // extremely unlikely fallback: a guaranteed-different rotation
  out = [...items.slice(1), items[0]]
  return out
}
