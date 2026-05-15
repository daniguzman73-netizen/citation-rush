interface Props {
  onBack: () => void
}

// Phase 4 will replace this with the imported Citation Challenge Nexus Extend demo component.
export default function DemoPlaceholder({ onBack }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 bg-gradient-to-b from-purple-950 via-neutral-950 to-neutral-950">
      <div className="text-xs uppercase tracking-[0.3em] text-purple-300/80">Nexus Extend</div>
      <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-center">
        See how Nexus dodges bad citations for you.
      </h2>
      <p className="mt-6 max-w-xl text-center text-neutral-400 italic">
        (Phase 4 will plug in the Citation Challenge Nexus Extend demo component here — chat + sidebar reveal, full-text access, alternatives, library services.)
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-10 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm transition-colors"
      >
        ← Back to start
      </button>
    </div>
  )
}
