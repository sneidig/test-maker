# The Test Maker

A browser game that trains you to **think in unit tests**. Instead of focusing on the method
you're writing, it flips your attention to the *test*: what to assert, which cases to cover,
and when a test goes green or red.

Built for C# / xUnit, but the thinking (happy path vs. edge vs. null vs. throws, expected-vs-actual,
the null-return trap) is framework-agnostic.

## Zones (Phase 0)

| Zone | Primitive | What you practice |
|---|---|---|
| **Anatomy of a Test** | `ordering` | Arrange → Act → Assert (and where cleanup goes) |
| **Assertions** | `matching` | pick the right xUnit assert — `Equal` vs `Same`, `Throws`, `Null`, `Contains`, `Empty` |
| **What Should You Test?** | `classify` | sort candidate cases into happy path / edge & boundary / null & empty / throws |
| **Will the Test Pass?** | `predict` | read the method + the test → predict pass, fail, or a `NullReferenceException` before the assert |

Wrong answers aren't a red ✗ — they give a **tiered hint ladder** (a nudge → the concept → the exact
fix), and every draggable/legend item has an **ⓘ** with a plain-English explanation, so you finish by
*understanding*, not by shuffling until it's green.

## Shared engine

This runs on the same data-driven reasoning engine as
[The Request's Journey](https://github.com/sneidig/requests-journey) — five puzzle primitives
(`ordering`, `matching`, `classify`, `predict`, `spotBug`), levels authored as JSON, deterministic
client-side grading. The Test Maker is a different **content pack** on that engine, with its own
brand (violet accent, a test-flask mascot). New zone = new JSON; no engine changes.

```
client/
├─ src/
│  ├─ engine/     types.ts · evaluate.ts · one renderer per primitive · LevelPlayer.tsx
│  ├─ content/    anatomy · assertions · what-to-test · will-it-pass  (the JSON packs)
│  ├─ map/        WorldMap.tsx · Packet.tsx (the flask mascot)
│  ├─ state/      progress.ts (localStorage)
│  └─ App.tsx     state-based navigation (no router → portable to any Pages sub-path)
└─ .github/workflows/deploy.yml   ← builds + publishes to GitHub Pages on push to main
```

## Run it locally

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to client/dist
```

## Deploy (GitHub Pages)

Push to `main`, then set **Settings → Pages → Source: GitHub Actions**. The workflow builds
`client/` and publishes it. `base: './'` in `vite.config.ts` keeps it working under any
`https://<user>.github.io/<repo>/` sub-path.
