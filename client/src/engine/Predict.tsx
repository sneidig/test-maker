// Renderer for the `predict` primitive: read a scenario, pick the one outcome
// the framework actually produces. Used by Routing, Model Binding, EntityState,
// and the Service hub. Single-select (radio-style) multiple choice.

import { useEffect, useState } from 'react'
import type { PredictBlock, PredictOption } from './types'

interface PredictProps {
  blocks?: PredictBlock[]
  options: PredictOption[]
  resetKey: string
  locked?: boolean
  /** reports the selected option id (or null) */
  onChange: (optionId: string | null) => void
}

export function Predict({ blocks, options, resetKey, locked, onChange }: PredictProps) {
  const [sel, setSel] = useState<string | null>(null)

  useEffect(() => {
    setSel(null)
    onChange(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function choose(id: string) {
    if (locked) return
    setSel(id)
    onChange(id)
  }

  return (
    <div className="predict">
      {blocks?.map((b, i) => (
        <div className="codeblock" key={i}>
          {b.label && <span className="codeblock__label">{b.label}</span>}
          <pre className="codeblock__code">{b.code}</pre>
        </div>
      ))}

      <ul className="predict__opts">
        {options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              disabled={locked}
              aria-pressed={sel === o.id}
              className={`opt${sel === o.id ? ' opt--on' : ''}`}
              onClick={() => choose(o.id)}
            >
              <span className="opt__radio" aria-hidden />
              <span className="opt__main">
                <span className="opt__label">{o.label}</span>
                {o.note && <span className="opt__note">{o.note}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
