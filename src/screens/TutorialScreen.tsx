import { useEffect } from 'react'

interface Props { onDone: () => void }

const AUTO_ADVANCE_MS = 5000

const tileBase =
  'flex flex-col items-center justify-center rounded-2xl bg-neutral-900/80 border border-white/10 p-8 min-w-[14rem]'

export default function TutorialScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <h2 className="text-2xl md:text-3xl font-semibold mb-10 text-neutral-200">How to play</h2>

      <div className="flex flex-wrap gap-6 justify-center">
        <div className={tileBase}>
          <div className="text-5xl">⬅️ ➡️</div>
          <div className="mt-4 text-sm uppercase tracking-widest text-neutral-400">Switch lanes</div>
        </div>
        <div className={tileBase}>
          <div className="text-5xl">⬆️</div>
          <div className="mt-4 text-sm uppercase tracking-widest text-neutral-400">Jump</div>
        </div>
        <div className={tileBase}>
          <div className="text-5xl">🎯</div>
          <div className="mt-4 text-sm uppercase tracking-widest text-neutral-400 text-center">
            Collect green<br />Dodge red<br />3 hits = game over
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-12 px-10 py-4 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-xl font-semibold transition-colors shadow-lg shadow-purple-900/40"
      >
        Let's run →
      </button>
      <p className="mt-3 text-xs text-neutral-500">
        Starts automatically in {Math.round(AUTO_ADVANCE_MS / 1000)}s
      </p>
    </div>
  )
}
