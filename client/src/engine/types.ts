// The level-content type system — the backbone of the "levels are data" design.
// Every level is one of a few puzzle PRIMITIVES, authored as JSON and validated
// against these types. New level = new JSON object; the engine renders it with
// one component per primitive (see ./Ordering.tsx, ./Matching.tsx).

export type Tier = 'free' | 'full'

// The 5 primitives from the spec. Phase 0 implements the first two.
export type Primitive =
  | 'ordering'
  | 'matching'
  | 'classify' // (not yet implemented)
  | 'predict' // (not yet implemented)
  | 'spotBug' // (not yet implemented)

interface BaseLevel {
  /** unique id; a future LevelProgress row references this, e.g. "middleware-l1" */
  id: string
  zone: string
  tier: Tier
  title: string
  prompt: string
  primitive: Primitive
  /**
   * Per-item explanations, keyed by tile/item name. Attached from the pack-level
   * glossary at load time so the player can learn what each piece *is* without
   * leaving the game. The teaching layer for "I don't know what HSTS is."
   */
  glossary?: Record<string, string>
}

// ── ordering ───────────────────────────────────────────────────────────────
// Drag tiles into the correct sequence. Used by Middleware (Z1) & Filters (Z4).

/**
 * A fail-state RULE is a predicate over the *player's* answer. When the predicate
 * is true, the player made that specific mistake — so we surface its lesson.
 * (The spec sketched these as English `when` strings; structured rules make them
 * actually executable while carrying the same meaning.)
 */
export type OrderRule =
  /** the player placed `a` somewhere before `b` (when the answer wants the reverse) */
  | { type: 'before'; a: string; b: string }
  /** the player did NOT place `a` immediately before `b` */
  | { type: 'notImmediatelyBefore'; a: string; b: string }

export interface OrderingFailState {
  rule: OrderRule
  /** short headline for the lesson, e.g. "Authorized before routing" */
  title: string
  /** the teaching text — *why* the request breaks this way */
  explain: string
}

export interface OrderingLevel extends BaseLevel {
  primitive: 'ordering'
  payload: { tiles: string[] }
  solution: { order: string[] }
  failStates?: OrderingFailState[]
}

// ── matching ───────────────────────────────────────────────────────────────
// Connect each left item to its right item. Used by Status codes (Z6),
// DI lifetimes (Z5a/5d).

export interface MatchItem {
  id: string
  label: string
  /** optional sublabel, e.g. a hint or the numeric code */
  note?: string
}

export interface MatchingFailState {
  /** triggers when the player connects this exact wrong pair */
  when: { leftId: string; rightId: string }
  title: string
  explain: string
}

export interface MatchingLevel extends BaseLevel {
  primitive: 'matching'
  payload: { left: MatchItem[]; right: MatchItem[]; leftTitle?: string; rightTitle?: string }
  /** correct mapping: leftId -> rightId */
  solution: { pairs: Record<string, string> }
  failStates?: MatchingFailState[]
}

// ── classify ───────────────────────────────────────────────────────────────
// Tag each item with one of N categories. Used by DI lifetimes (Z5a).

export interface ClassifyItem {
  id: string
  label: string
  /** a property of the thing being classified — the input to the decision */
  note?: string
}

export interface ClassifyCategory {
  id: string
  label: string
}

export interface ClassifyFailState {
  /** triggers when the player files this item under this wrong category */
  when: { itemId: string; categoryId: string }
  title: string
  explain: string
}

export interface ClassifyLevel extends BaseLevel {
  primitive: 'classify'
  payload: { items: ClassifyItem[]; categories: ClassifyCategory[] }
  /** correct assignment: itemId -> categoryId */
  solution: { assignments: Record<string, string> }
  failStates?: ClassifyFailState[]
}

// ── predict ─────────────────────────────────────────────────────────────---
// Apply the rules to a scenario and choose the single correct outcome. Used by
// Routing (Z2), Model Binding (Z3), EntityState (Z8), Service (Z7).

export interface PredictBlock {
  /** small caption above the code, e.g. "Incoming request" */
  label?: string
  /** monospace content; may contain newlines */
  code: string
}

export interface PredictOption {
  id: string
  label: string
  note?: string
}

export interface PredictFailState {
  /** triggers when the player picks this wrong option */
  when: { optionId: string }
  title: string
  explain: string
}

export interface PredictLevel extends BaseLevel {
  primitive: 'predict'
  payload: { blocks?: PredictBlock[]; options: PredictOption[] }
  solution: { optionId: string }
  failStates?: PredictFailState[]
}

// ── spotBug ─────────────────────────────────────────────────────────────---
// Find the offending node (a registration / a line) AND pick the fix. Used by
// the DI captive-dependency level (Z5b) and the Repository N+1 level (Z8).

export interface SpotBugNode {
  id: string
  label: string
  /** secondary line, e.g. the lifetime or what the line does */
  sub?: string
}

export interface SpotBugFix {
  id: string
  label: string
}

export interface SpotBugFailState {
  /** match on a wrong node selection and/or a wrong fix selection */
  when: { nodeId?: string; fixId?: string }
  title: string
  explain: string
}

export interface SpotBugLevel extends BaseLevel {
  primitive: 'spotBug'
  payload: {
    intro?: string
    nodes: SpotBugNode[]
    fixPrompt?: string
    fixes: SpotBugFix[]
  }
  solution: { nodeId: string; fixId: string }
  failStates?: SpotBugFailState[]
}

// ── union ────────────────────────────────────────────────────────────────--
export type Level = OrderingLevel | MatchingLevel | ClassifyLevel | PredictLevel | SpotBugLevel

export interface Zone {
  id: string
  title: string
  blurb: string
  /** pack-level explanations shared across the zone's levels, keyed by item name */
  glossary?: Record<string, string>
  levels: Level[]
}
