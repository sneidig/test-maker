// Loads the bundled content packs. The engine never special-cases a zone — it
// just renders whatever JSON these packs provide. New zone = new JSON file
// imported here; new primitive is rare (the five renderers already exist).

import type { Zone } from '../engine/types'
import anatomy from './anatomy.json'
import assertions from './assertions.json'
import whatToTest from './what-to-test.json'
import willItPass from './will-it-pass.json'

// The JSON is authored to match the discriminated union in engine/types.ts.
// We assert the type here at the single load boundary.
// Learning order: what a test looks like → how to assert → what to test → will it pass.
export const zones = [
  anatomy, // ordering — Arrange / Act / Assert
  assertions, // matching — assertion ↔ what it verifies
  whatToTest, // classify — sort candidate cases (happy / edge / null / throws)
  willItPass, // predict — read the code, predict pass / fail
] as unknown as Zone[]

// Attach each zone's glossary to its levels so a level is self-describing once
// loaded (the player can look up any item without the engine knowing the topic).
export const allLevels = zones.flatMap((z) =>
  z.levels.map((l) => ({ ...l, glossary: l.glossary ?? z.glossary })),
)

export function findLevel(id: string) {
  return allLevels.find((l) => l.id === id)
}
