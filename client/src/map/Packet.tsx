// The mascot: a little test flask with a face (The Test Maker's answer to the
// request packet). Same component name/API and CSS classes as before so it
// recolors by mood and reuses the existing animations without touching callers.
// Colors come from CSS vars so themes/states recolor without re-drawing.

type Mood = 'neutral' | 'happy' | 'bounced'

export function Packet({ mood = 'neutral', size = 64 }: { mood?: Mood; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={`test flask (${mood})`}
      className={`packet packet--${mood}`}
    >
      {/* cork */}
      <rect x="27" y="6" width="10" height="6" rx="2" className="packet__face" />
      {/* flask outline: narrow neck flaring to a rounded conical body */}
      <path
        d="M28 11 L28 27 L13 50 Q11 55 16 55 L48 55 Q53 55 51 50 L36 27 L36 11 Z"
        className="packet__body"
        strokeWidth="2"
      />
      {/* liquid level line */}
      <path d="M20 44 L44 44" className="packet__flap" fill="none" strokeWidth="3" />
      {/* eyes */}
      <circle cx="26" cy="46" r="2.6" className="packet__face" />
      <circle cx="38" cy="46" r="2.6" className="packet__face" />
      {/* mouth changes with mood */}
      {mood === 'happy' && (
        <path d="M27 50q5 5 10 0" className="packet__face" fill="none" strokeWidth="2.5" />
      )}
      {mood === 'neutral' && (
        <path d="M28 51h8" className="packet__face" fill="none" strokeWidth="2.5" />
      )}
      {mood === 'bounced' && (
        <path d="M27 52q5 -5 10 0" className="packet__face" fill="none" strokeWidth="2.5" />
      )}
    </svg>
  )
}
