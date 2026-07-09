// Renderer for the `spotBug` primitive: select the offending node (a bad
// registration or a problematic line), then pick the fix. Used by the DI
// captive-dependency level and the Repository N+1 level. Two-step selection.

import { useEffect, useState } from 'react'
import type { SpotBugNode, SpotBugFix } from './types'

interface SpotBugProps {
  intro?: string
  nodes: SpotBugNode[]
  fixPrompt?: string
  fixes: SpotBugFix[]
  resetKey: string
  locked?: boolean
  /** reports the current selection { nodeId, fixId } */
  onChange: (sel: { nodeId?: string; fixId?: string }) => void
}

export function SpotBug({
  intro,
  nodes,
  fixPrompt,
  fixes,
  resetKey,
  locked,
  onChange,
}: SpotBugProps) {
  const [nodeId, setNodeId] = useState<string | undefined>()
  const [fixId, setFixId] = useState<string | undefined>()

  useEffect(() => {
    setNodeId(undefined)
    setFixId(undefined)
    onChange({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function pickNode(id: string) {
    if (locked) return
    setNodeId(id)
    onChange({ nodeId: id, fixId })
  }
  function pickFix(id: string) {
    if (locked) return
    setFixId(id)
    onChange({ nodeId, fixId: id })
  }

  return (
    <div className="spotbug">
      {intro && <p className="spotbug__intro">{intro}</p>}

      <ol className="spotbug__nodes">
        {nodes.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              disabled={locked}
              aria-pressed={nodeId === n.id}
              className={`sbnode${nodeId === n.id ? ' sbnode--on' : ''}`}
              onClick={() => pickNode(n.id)}
            >
              <span className="sbnode__pick" aria-hidden>
                {nodeId === n.id ? '✕' : ''}
              </span>
              <span className="sbnode__main">
                <code className="sbnode__label">{n.label}</code>
                {n.sub && <span className="sbnode__sub">{n.sub}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <p className="spotbug__fixlabel">{fixPrompt ?? 'And the fix?'}</p>
      <div className="spotbug__fixes">
        {fixes.map((f) => (
          <button
            type="button"
            key={f.id}
            disabled={locked}
            aria-pressed={fixId === f.id}
            className={`opt${fixId === f.id ? ' opt--on' : ''}`}
            onClick={() => pickFix(f.id)}
          >
            <span className="opt__radio" aria-hidden />
            <span className="opt__main">
              <span className="opt__label">{f.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
