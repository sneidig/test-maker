// The world map: the left-to-right journey of the request. Each zone is a gate;
// within a zone, levels unlock in sequence as the player clears them. Phase 0
// keeps both zones open; tier-gating arrives with the backend (Phase 3).

import { zones } from '../content'
import type { Progress } from '../state/progress'
import { Packet } from './Packet'

interface WorldMapProps {
  progress: Progress
  onPick: (levelId: string) => void
  onReset: () => void
}

export function WorldMap({ progress, onPick, onReset }: WorldMapProps) {
  const done = (id: string) => progress.completed.includes(id)
  const totalCleared = progress.completed.length

  function handleReset() {
    if (totalCleared === 0) return
    if (window.confirm('Reset all progress and start over? This clears every cleared level.')) {
      onReset()
    }
  }

  return (
    <div className="map">
      <header className="map__hero">
        <Packet mood="neutral" size={72} />
        <div>
          <h1>The Test Maker</h1>
          <p className="map__tagline">
            Stop thinking about the method — start thinking about the <em>test</em>. Train the
            instinct for what to assert, which cases to cover, and when a test goes green or red.
          </p>
          <p className="map__progress">{totalCleared} level{totalCleared === 1 ? '' : 's'} cleared</p>
        </div>
      </header>

      <div className="map__track">
        {zones.map((zone) => {
          // a level is unlocked if it's the first, or the previous one is done
          return (
            <section className="zone" key={zone.id}>
              <div className="zone__head">
                <h2>{zone.title}</h2>
                <p className="zone__blurb">{zone.blurb}</p>
              </div>
              <ol className="zone__levels">
                {zone.levels.map((level, i) => {
                  const prev = zone.levels[i - 1]
                  const unlocked = i === 0 || (prev && done(prev.id))
                  const cleared = done(level.id)
                  return (
                    <li key={level.id}>
                      <button
                        className={`node${cleared ? ' node--done' : ''}${
                          unlocked ? '' : ' node--locked'
                        }`}
                        disabled={!unlocked}
                        onClick={() => onPick(level.id)}
                      >
                        <span className="node__status" aria-hidden>
                          {cleared ? '✓' : unlocked ? '●' : '🔒'}
                        </span>
                        <span className="node__title">{level.title}</span>
                        <span className="node__primitive">{level.primitive}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>

      <footer className="map__foot">
        <span className="tag">Phase 0 prototype · client-only · progress saved in this browser</span>
        {totalCleared > 0 && (
          <button className="link link--reset" onClick={handleReset}>
            Reset progress
          </button>
        )}
      </footer>
    </div>
  )
}
