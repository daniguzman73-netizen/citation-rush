import { useEffect } from 'react'

interface Props { onDone: () => void }

const tileBase =
  'flex flex-col items-center justify-center rounded-2xl bg-neutral-900/80 border border-white/10 p-8 min-w-[14rem]'

export default function TutorialScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDone}
      onKeyDown={onDone}
      className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 cursor-pointer"
    >
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

      <p className="mt-12 text-xs text-neutral-500">Tap anywhere to start</p>
    </div>
  )
}
