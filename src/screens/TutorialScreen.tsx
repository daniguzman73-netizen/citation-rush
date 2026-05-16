import { useEffect } from 'react'

interface Props { onDone: () => void }

const AUTO_ADVANCE_MS = 5000

const tileBase =
  'flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm p-8 min-w-[14rem]'

export default function TutorialScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-[#F3F4F6]">
      <h2 className="text-2xl md:text-3xl font-semibold mb-10 text-gray-900">How to play</h2>

      <div className="flex flex-wrap gap-6 justify-center">
        <div className={tileBase}>
          <div className="text-5xl">⬅️ ➡️</div>
          <div className="mt-4 text-sm uppercase tracking-widest text-gray-500">Switch lanes</div>
        </div>
        <div className={tileBase}>
          <div className="text-5xl">⬆️</div>
          <div className="mt-4 text-sm uppercase tracking-widest text-gray-500">Jump</div>
        </div>
        <div className={tileBase}>
          <div className="text-5xl">🎯</div>
          <div className="mt-4 text-sm uppercase tracking-widest text-gray-500 text-center">
            Collect green<br />Dodge red<br />3 hits = game over
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-12 px-10 py-4 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xl font-semibold transition-colors shadow-lg shadow-purple-900/20"
      >
        Let's run →
      </button>
      <p className="mt-3 text-xs text-gray-400">
        Starts automatically in {Math.round(AUTO_ADVANCE_MS / 1000)}s
      </p>
    </div>
  )
}
