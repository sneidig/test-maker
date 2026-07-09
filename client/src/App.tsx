// App shell. Navigation is plain component state (no router) so the build is
// portable to any GitHub Pages sub-path with zero config. Two views: the world
// map and the active level.

import { useMemo, useState } from 'react'
import { WorldMap } from './map/WorldMap'
import { LevelPlayer } from './engine/LevelPlayer'
import { allLevels, findLevel } from './content'
import { load, markComplete, recordAttempt, reset, type Progress } from './state/progress'

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => load())
  const [activeId, setActiveId] = useState<string | null>(null)

  const active = activeId ? findLevel(activeId) : undefined

  // the next level in the flat catalog, for the "Next level →" button.
  // NOTE: all hooks must run before any early return (Rules of Hooks).
  const nextId = useMemo(() => {
    if (!active) return null
    const i = allLevels.findIndex((l) => l.id === active.id)
    return i >= 0 && i + 1 < allLevels.length ? allLevels[i + 1].id : null
  }, [active])

  if (!active) {
    return (
      <WorldMap progress={progress} onPick={setActiveId} onReset={() => setProgress(reset())} />
    )
  }

  return (
    // key on the level id so switching levels (e.g. "Next level →") remounts a
    // fresh player — otherwise the previous level's solved/result state lingers
    // and the new level looks already-completed.
    <LevelPlayer
      key={active.id}
      level={active}
      alreadyComplete={progress.completed.includes(active.id)}
      onAttempt={(id) => setProgress((p) => recordAttempt(p, id))}
      onComplete={(id) => setProgress((p) => markComplete(p, id))}
      onBack={() => setActiveId(null)}
      onNext={nextId ? () => setActiveId(nextId) : null}
    />
  )
}
