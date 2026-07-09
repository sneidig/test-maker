// Renderer for the `ordering` primitive: drag tiles into the correct sequence.
// Used by the Middleware zone (Z1). The component is "controlled" — it owns the
// current tile order and reports it up via onChange so LevelPlayer can grade it.

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
import { Packet } from '../map/Packet'

interface OrderingProps {
  tiles: string[]
  /** per-tile explanations, keyed by tile name; shown via the info badge */
  hints?: Record<string, string>
  /** reset internal order when this changes (e.g. switching levels / retrying) */
  resetKey: string
  locked?: boolean
  onChange: (order: string[]) => void
}

export function Ordering({ tiles, hints, resetKey, locked, onChange }: OrderingProps) {
  const [order, setOrder] = useState<string[]>(tiles)
  // -1 = not walking; otherwise the index the request packet is currently at.
  // When the level is solved (locked), the packet steps down the pipeline.
  const [walkStep, setWalkStep] = useState(-1)

  // re-seed when the level changes
  useEffect(() => {
    setOrder(tiles)
    onChange(tiles)
    setWalkStep(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // on solve, walk the packet from the top tile to the endpoint, one step at a time
  useEffect(() => {
    if (!locked) {
      setWalkStep(-1)
      return
    }
    setWalkStep(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      if (i >= order.length) {
        clearInterval(id)
        return
      }
      setWalkStep(i)
    }, 260)
    return () => clearInterval(id)
  }, [locked, order.length])

  const sensors = useSensors(
    // require a small drag before sorting kicks in, so a tap/click on a tile's
    // info badge reads the hint instead of yanking the tile around
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder((items) => {
      const next = arrayMove(items, items.indexOf(active.id as string), items.indexOf(over.id as string))
      onChange(next)
      return next
    })
  }

  return (
    <div className="ordering">
      <div className="ordering__rail" aria-hidden>
        <span className="ordering__rail-label">runs top → bottom ↓</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="ordering__list">
            {order.map((tile, i) => (
              <SortableTile
                key={tile}
                id={tile}
                index={i}
                hint={hints?.[tile]}
                locked={locked}
                passed={walkStep >= 0 && i <= walkStep}
                current={walkStep === i}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableTile({
  id,
  index,
  hint,
  locked,
  passed,
  current,
}: {
  id: string
  index: number
  hint?: string
  locked?: boolean
  passed?: boolean
  current?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: locked,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`tile${locked ? ' tile--locked' : ''}${passed ? ' tile--passed' : ''}${
        current ? ' tile--current' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      {current && (
        <span className="tile__walker" aria-hidden>
          <Packet mood="happy" size={30} />
        </span>
      )}
      <span className="tile__index">{index + 1}</span>
      <code className="tile__label">{id}</code>
      {hint ? (
        <span
          className="tile__info"
          tabIndex={0}
          role="note"
          aria-label={`What is ${id}? ${hint}`}
          // keep taps/clicks/keys on the badge from starting a drag
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          i
          <span className="tile__tip" role="tooltip">
            <strong>{id}</strong>
            {hint}
          </span>
        </span>
      ) : (
        <span aria-hidden />
      )}
      <span className="tile__grip" aria-hidden>⋮⋮</span>
    </li>
  )
}
