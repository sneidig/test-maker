// Plays a single level: renders the right primitive, grades the answer on Check,
// and turns a wrong answer into a self-explaining fail-state lesson. This is the
// generic shell every primitive shares — the renderer is swapped by level.primitive.

import { useState } from 'react'
import { Ordering } from './Ordering'
import { Matching } from './Matching'
import { Classify } from './Classify'
import { Predict } from './Predict'
import { SpotBug } from './SpotBug'
import { evaluate, type Result } from './evaluate'
import { Packet } from '../map/Packet'
import type { Level } from './types'

interface LevelPlayerProps {
  level: Level
  alreadyComplete: boolean
  onAttempt: (levelId: string) => void
  onComplete: (levelId: string) => void
  onBack: () => void
  onNext: (() => void) | null
}

export function LevelPlayer({
  level,
  alreadyComplete,
  onAttempt,
  onComplete,
  onBack,
  onNext,
}: LevelPlayerProps) {
  // current answer, shape depends on the primitive
  const [answer, setAnswer] = useState<unknown>(null)
  const [result, setResult] = useState<Result | null>(null)
  // how many hint tiers are currently revealed (progressive disclosure)
  const [revealed, setRevealed] = useState(1)

  const solved = result?.correct === true
  const hints = result?.hints ?? []

  function check() {
    const r = evaluate(level, answer)
    setResult(r)
    setRevealed(1)
    onAttempt(level.id)
    if (r.correct) onComplete(level.id)
  }

  function retry() {
    setResult(null)
    setRevealed(1)
  }

  return (
    <section className="player">
      <header className="player__head">
        <button className="link" onClick={onBack}>← Map</button>
        <div className="player__titles">
          <span className="player__zone">{level.zone}</span>
          <h2>{level.title}</h2>
        </div>
        {alreadyComplete && <span className="badge badge--done">cleared</span>}
      </header>

      <p className="player__prompt">{level.prompt}</p>

      <div className="player__stage">
        {level.primitive === 'ordering' && (
          <Ordering
            tiles={level.payload.tiles}
            hints={level.glossary}
            resetKey={level.id}
            locked={solved}
            onChange={setAnswer}
          />
        )}
        {level.primitive === 'matching' && (
          <Matching
            left={level.payload.left}
            right={level.payload.right}
            leftTitle={level.payload.leftTitle}
            rightTitle={level.payload.rightTitle}
            resetKey={level.id}
            locked={solved}
            onChange={setAnswer}
          />
        )}
        {level.primitive === 'classify' && (
          <Classify
            items={level.payload.items}
            categories={level.payload.categories}
            glossary={level.glossary}
            resetKey={level.id}
            locked={solved}
            onChange={setAnswer}
          />
        )}
        {level.primitive === 'predict' && (
          <Predict
            blocks={level.payload.blocks}
            options={level.payload.options}
            resetKey={level.id}
            locked={solved}
            onChange={setAnswer}
          />
        )}
        {level.primitive === 'spotBug' && (
          <SpotBug
            intro={level.payload.intro}
            nodes={level.payload.nodes}
            fixPrompt={level.payload.fixPrompt}
            fixes={level.payload.fixes}
            resetKey={level.id}
            locked={solved}
            onChange={setAnswer}
          />
        )}
      </div>

      {/* result strip — progressive hints, vague → exact */}
      {result && !result.correct && hints.length > 0 && (
        <div className="result result--fail" role="alert">
          <Packet mood="bounced" size={56} />
          <div className="result__body">
            {hints.slice(0, revealed).map((h, i) => (
              <div key={i} className={`hint${i === revealed - 1 ? ' hint--latest' : ''}`}>
                <strong className="result__title">{h.title}</strong>
                <p className="result__explain">{h.body}</p>
              </div>
            ))}
            {revealed < hints.length && (
              <button className="btn btn--ghost btn--sm" onClick={() => setRevealed((r) => r + 1)}>
                {revealed === hints.length - 1 ? 'Show me the exact fix →' : 'I need another hint →'}
              </button>
            )}
          </div>
        </div>
      )}

      {solved && (
        <div className="result result--pass" role="status">
          <Packet mood="happy" size={56} />
          <div>
            <strong className="result__title">✅ Green — that's correct.</strong>
            <p className="result__explain">Nice. On to the next one.</p>
          </div>
        </div>
      )}

      <footer className="player__actions">
        {!solved && !result && (
          <button className="btn btn--primary" onClick={check} disabled={answer == null}>
            Check
          </button>
        )}
        {!solved && result && !result.correct && (
          <button className="btn btn--primary" onClick={retry}>Try again</button>
        )}
        {solved &&
          (onNext ? (
            <button className="btn btn--primary" onClick={onNext}>Next level →</button>
          ) : (
            <button className="btn btn--primary" onClick={onBack}>Back to map</button>
          ))}
      </footer>
    </section>
  )
}
