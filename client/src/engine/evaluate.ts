// Deterministic, client-side grading — the core of the engine. Given a level and
// the player's answer it returns whether they're correct, and on a wrong answer a
// LADDER of hints, ordered vague → conceptual → exact fix.
//
// This is the "fail-states-as-lessons" mechanic with progressive disclosure: a
// wrong answer is never just a red X, but it also doesn't hand over the answer.
// The player gets a gentle nudge first and can opt into more help only if stuck —
// so they finish by *understanding*, not by being told the move immediately.

import type {
  Level,
  OrderingLevel,
  MatchingLevel,
  ClassifyLevel,
  PredictLevel,
  SpotBugLevel,
} from './types'

export interface Hint {
  title: string
  body: string
}

export interface Result {
  correct: boolean
  /** present when incorrect: hints from vague (index 0) to explicit (last) */
  hints?: Hint[]
}

// ── ordering ─────────────────────────────────────────────────────────────--

function evaluateOrdering(level: OrderingLevel, answer: string[]): Result {
  if (arraysEqual(answer, level.solution.order)) return { correct: true }

  const idx = (tile: string) => answer.indexOf(tile)

  // (a) conceptual "why": the first authored fail-state this mistake triggers
  let why: Hint | null = null
  for (const fs of level.failStates ?? []) {
    const { rule } = fs
    const triggered =
      rule.type === 'before'
        ? idx(rule.a) !== -1 && idx(rule.b) !== -1 && idx(rule.a) < idx(rule.b)
        : idx(rule.a) === -1 || idx(rule.b) !== idx(rule.a) + 1
    if (triggered) {
      why = { title: fs.title, body: fs.explain }
      break
    }
  }

  // (b) the exact mechanical fix: first slot that diverges from the answer key
  const order = level.solution.order
  const firstWrong = order.findIndex((tile, i) => answer[i] !== tile)
  const shouldBe = order[firstWrong]
  const got = answer[firstWrong]
  const place = firstWrong === 0 ? 'at the very top' : `right after ${order[firstWrong - 1]}`

  const hints: Hint[] = [
    // tier 1 — vague, and points back at the per-tile ⓘ glossary
    {
      title: 'Not quite — one step is out of place',
      body: "Work through the pipeline top to bottom. If you're unsure what a tile does, hover its ⓘ to learn what it is and roughly when it runs.",
    },
    // tier 2 — conceptual why (authored), or a reasoning nudge naming the tile
    why ?? {
      title: `Look at where ${shouldBe} sits`,
      body: `Compare ${shouldBe} and ${got}. Think about what each one needs to have happened before it can do its job — that tells you which runs first.`,
    },
    // tier 3 — the explicit move
    {
      title: 'The exact fix',
      body: `Move ${shouldBe} to step ${firstWrong + 1} (${place}). You currently have ${got} there. Later steps often fall into place once this one is right.`,
    },
  ]

  return { correct: false, hints }
}

// ── matching ─────────────────────────────────────────────────────────────--

function evaluateMatching(level: MatchingLevel, answer: Record<string, string>): Result {
  const correct = Object.entries(level.solution.pairs).every(
    ([leftId, rightId]) => answer[leftId] === rightId,
  )
  if (correct) return { correct: true }

  const leftLabel = (id: string) => level.payload.left.find((l) => l.id === id)?.label ?? id
  const rightLabel = (id: string) => level.payload.right.find((r) => r.id === id)?.label ?? id

  // conceptual "why" from an authored fail-state, if this exact wrong pair matches
  let why: Hint | null = null
  for (const fs of level.failStates ?? []) {
    if (answer[fs.when.leftId] === fs.when.rightId) {
      why = { title: fs.title, body: fs.explain }
      break
    }
  }

  const wrongLeft = Object.keys(level.solution.pairs).find(
    (leftId) => answer[leftId] && answer[leftId] !== level.solution.pairs[leftId],
  )
  const unanswered = Object.keys(level.solution.pairs).find((leftId) => !answer[leftId])

  // build the ladder around whichever problem exists (a wrong pair, else a gap)
  const focusLeft = wrongLeft ?? unanswered
  if (!focusLeft) return { correct: false, hints: [genericMatchHint()] }

  const answerCode = rightLabel(level.solution.pairs[focusLeft])

  const hints: Hint[] = [
    {
      title: wrongLeft ? 'Some pairs are off' : 'Not every helper is connected yet',
      body: wrongLeft
        ? 'At least one connection is wrong. The grey note under each helper hints at what it does.'
        : `${leftLabel(focusLeft)} still needs a match. Connect all of them, then check.`,
    },
    why ?? {
      title: `Re-check ${leftLabel(focusLeft)}`,
      body: `Think about what status code ${leftLabel(focusLeft)} actually produces — its name is the clue.`,
    },
    {
      title: 'The exact fix',
      body: `${leftLabel(focusLeft)} should connect to ${answerCode}.`,
    },
  ]

  return { correct: false, hints }
}

function genericMatchHint(): Hint {
  return {
    title: 'Some pairs are off',
    body: 'At least one connection is wrong. Re-check the mismatched pairs and try again.',
  }
}

// ── classify ─────────────────────────────────────────────────────────────--

function evaluateClassify(level: ClassifyLevel, answer: Record<string, string>): Result {
  const sol = level.solution.assignments
  const correct = Object.keys(sol).every((id) => answer[id] === sol[id])
  if (correct) return { correct: true }

  const itemLabel = (id: string) => level.payload.items.find((i) => i.id === id)?.label ?? id
  const catLabel = (id: string) => level.payload.categories.find((c) => c.id === id)?.label ?? id

  // conceptual "why" from an authored fail-state, if this exact misfiling matches
  let why: Hint | null = null
  for (const fs of level.failStates ?? []) {
    if (answer[fs.when.itemId] === fs.when.categoryId) {
      why = { title: fs.title, body: fs.explain }
      break
    }
  }

  const wrong = Object.keys(sol).find((id) => answer[id] && answer[id] !== sol[id])
  const unassigned = Object.keys(sol).find((id) => !answer[id])
  const focus = wrong ?? unassigned
  if (!focus) {
    return {
      correct: false,
      hints: [{ title: 'Not quite', body: 'At least one item is in the wrong category.' }],
    }
  }

  const hints: Hint[] = [
    {
      title: wrong ? 'Not quite — check your buckets' : 'Something’s still unsorted',
      body: wrong
        ? 'At least one service has the wrong lifetime. The legend up top says what each lifetime is for.'
        : `${itemLabel(focus)} still needs a lifetime. Assign all of them, then check.`,
    },
    why ?? {
      title: `Reconsider ${itemLabel(focus)}`,
      body: `Think about ${itemLabel(focus)}: does it hold shared state for the whole app, live per request, or is it cheap and stateless? That decides the lifetime.`,
    },
    {
      title: 'The exact fix',
      body: `${itemLabel(focus)} should be ${catLabel(sol[focus])}.`,
    },
  ]

  return { correct: false, hints }
}

// ── predict ──────────────────────────────────────────────────────────────--

function evaluatePredict(level: PredictLevel, answer: string | null): Result {
  if (answer === level.solution.optionId) return { correct: true }

  const optLabel = (id: string) => level.payload.options.find((o) => o.id === id)?.label ?? id
  const correctOpt = level.payload.options.find((o) => o.id === level.solution.optionId)

  const why = level.failStates?.find((fs) => fs.when.optionId === answer)

  const hints: Hint[] = [
    {
      title: "That's not what the framework does",
      body: 'Re-read the scenario above and apply the rule step by step.',
    },
    why
      ? { title: why.title, body: why.explain }
      : {
          title: answer ? `Reconsider "${optLabel(answer)}"` : 'Pick an outcome first',
          body: answer
            ? 'Walk through what actually happens to the request in this case.'
            : 'Choose one of the options, then check.',
        },
    {
      title: 'The answer',
      body: `It's "${correctOpt?.label ?? level.solution.optionId}".${
        correctOpt?.note ? ' ' + correctOpt.note : ''
      }`,
    },
  ]

  return { correct: false, hints }
}

// ── spotBug ──────────────────────────────────────────────────────────────--

function evaluateSpotBug(
  level: SpotBugLevel,
  answer: { nodeId?: string; fixId?: string },
): Result {
  const { nodeId, fixId } = level.solution
  const rightNode = answer.nodeId === nodeId
  const rightFix = answer.fixId === fixId
  if (rightNode && rightFix) return { correct: true }

  const nodeLabel = (id?: string) => level.payload.nodes.find((n) => n.id === id)?.label ?? id
  const fixLabel = (id?: string) => level.payload.fixes.find((f) => f.id === id)?.label ?? id

  const why = level.failStates?.find(
    (fs) =>
      (fs.when.nodeId !== undefined && fs.when.nodeId === answer.nodeId && !rightNode) ||
      (fs.when.fixId !== undefined && fs.when.fixId === answer.fixId && !rightFix),
  )

  let hints: Hint[]
  if (!answer.nodeId) {
    hints = [
      { title: 'Find the bug first', body: 'Select the line/registration that causes the problem.' },
    ]
  } else if (!rightNode) {
    hints = [
      { title: "That's not where the bug is", body: 'Look for the rule violation — what depends on what, or what runs when.' },
      why
        ? { title: why.title, body: why.explain }
        : { title: `Reconsider ${nodeLabel(answer.nodeId)}`, body: 'This one behaves correctly. Keep hunting.' },
      { title: 'The bug', body: `The offender is ${nodeLabel(nodeId)}.` },
    ]
  } else {
    // right node, wrong/missing fix
    hints = [
      { title: 'Right bug — now the fix', body: 'You found the offending node. Which option actually resolves it?' },
      why
        ? { title: why.title, body: why.explain }
        : { title: 'That fix falls short', body: 'It doesn’t address the root cause. Think about what the correct lifetime/relationship should be.' },
      { title: 'The fix', body: `${fixLabel(fixId)}.` },
    ]
  }

  return { correct: false, hints }
}

// ── dispatch ─────────────────────────────────────────────────────────────--

export function evaluate(level: Level, answer: unknown): Result {
  switch (level.primitive) {
    case 'ordering':
      return evaluateOrdering(level, answer as string[])
    case 'matching':
      return evaluateMatching(level, answer as Record<string, string>)
    case 'classify':
      return evaluateClassify(level, answer as Record<string, string>)
    case 'predict':
      return evaluatePredict(level, (answer as string | null) ?? null)
    case 'spotBug':
      return evaluateSpotBug(level, (answer as { nodeId?: string; fixId?: string }) ?? {})
    default:
      return { correct: false }
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}
