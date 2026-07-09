// Player progress, persisted to localStorage. This is the ONLY state the Phase 0
// prototype keeps — no backend, no accounts. Phase 2 swaps this module's storage
// for the /api/progress endpoint without the rest of the app noticing.

const KEY = 'tm.progress.v1'

export interface Progress {
  /** level ids the player has cleared */
  completed: string[]
  /** attempts per level id (for a future score/streak system) */
  attempts: Record<string, number>
}

const empty: Progress = { completed: [], attempts: {} }

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...empty }
    const parsed = JSON.parse(raw) as Progress
    return { completed: parsed.completed ?? [], attempts: parsed.attempts ?? {} }
  } catch {
    return { ...empty }
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable (private mode); progress just won't persist */
  }
}

export function markComplete(p: Progress, levelId: string): Progress {
  if (p.completed.includes(levelId)) return p
  const next = { ...p, completed: [...p.completed, levelId] }
  save(next)
  return next
}

export function recordAttempt(p: Progress, levelId: string): Progress {
  const next = {
    ...p,
    attempts: { ...p.attempts, [levelId]: (p.attempts[levelId] ?? 0) + 1 },
  }
  save(next)
  return next
}

export function reset(): Progress {
  save(empty)
  return { ...empty }
}
