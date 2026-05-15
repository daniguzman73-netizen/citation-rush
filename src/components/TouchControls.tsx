interface Props {
  onLeft: () => void
  onRight: () => void
  onJump: () => void
}

const btn =
  'select-none touch-manipulation rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 ' +
  'backdrop-blur text-white text-3xl font-bold border border-white/15 ' +
  'flex items-center justify-center shadow-lg transition-colors'

export default function TouchControls({ onLeft, onRight, onJump }: Props) {
  // pointerdown gives the snappiest mobile response and also fires on mouse
  const press = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault()
    fn()
  }

  return (
    <div className="absolute bottom-6 inset-x-0 flex items-end justify-between px-6 pointer-events-none">
      <button
        type="button"
        aria-label="Move left"
        onPointerDown={press(onLeft)}
        className={`${btn} w-20 h-20 pointer-events-auto`}
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Jump"
        onPointerDown={press(onJump)}
        className={`${btn} w-28 h-28 text-4xl pointer-events-auto`}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Move right"
        onPointerDown={press(onRight)}
        className={`${btn} w-20 h-20 pointer-events-auto`}
      >
        →
      </button>
    </div>
  )
}
