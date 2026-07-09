// Renderer for the `classify` primitive: tag each item with one of N categories.
// Used by the DI Lifetimes zone (Z5a). Interaction is a per-item segmented
// control (click a category chip) — compact, keyboard-friendly, no drag.
//
// A legend at the top explains each category from the pack glossary, so the
// player learns what Singleton/Scoped/Transient *mean* and can reason, rather
// than memorize an answer key.

import { useEffect, useState } from 'react'
import type { ClassifyItem, ClassifyCategory } from './types'

interface ClassifyProps {
  items: ClassifyItem[]
  categories: ClassifyCategory[]
  /** category explanations keyed by category label (the legend) */
  glossary?: Record<string, string>
  resetKey: string
  locked?: boolean
  /** reports the current assignment itemId -> categoryId */
  onChange: (assignments: Record<string, string>) => void
}

export function Classify({ items, categories, glossary, resetKey, locked, onChange }: ClassifyProps) {
  const [assign, setAssign] = useState<Record<string, string>>({})

  useEffect(() => {
    setAssign({})
    onChange({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function pick(itemId: string, categoryId: string) {
    if (locked) return
    setAssign((cur) => {
      const next = { ...cur, [itemId]: categoryId }
      onChange(next)
      return next
    })
  }

  return (
    <div className="classify">
      {glossary && (
        <div className="classify__legend">
          {categories.map((c) => (
            <div className="legend" key={c.id}>
              <strong className="legend__name">{c.label}</strong>
              {glossary[c.label] && <span className="legend__desc">{glossary[c.label]}</span>}
            </div>
          ))}
        </div>
      )}

      <ul className="classify__items">
        {items.map((item) => (
          <li className="citem" key={item.id}>
            <div className="citem__main">
              <span className="citem__label">{item.label}</span>
              {item.note && <span className="citem__note">{item.note}</span>}
            </div>
            <div className="citem__opts" role="group" aria-label={`Lifetime for ${item.label}`}>
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  disabled={locked}
                  aria-pressed={assign[item.id] === c.id}
                  className={`chip${assign[item.id] === c.id ? ' chip--on' : ''}`}
                  onClick={() => pick(item.id, c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
