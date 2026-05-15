import { GAME_DURATION_S } from '../game/constants'
import type { FinalResult, PlayerInfo } from '../types'

interface Props {
  player: PlayerInfo
  result: FinalResult
  onSeeNexus: () => void
  onPlayAgain: () => void
}

const badTypeMeta = [
  { key: 'predatory',    emoji: '💀', label: 'Predatory journals',     blurb: 'Pay-to-publish outlets with little or no peer review.' },
  { key: 'preprint',     emoji: '⚠️', label: 'Unreviewed preprints',    blurb: 'Early drafts shared before peer review — worth verifying.' },
  { key: 'paywalled',    emoji: '🔒', label: 'Paywalled sources',       blurb: "Behind a paywall and not in your library's collection." },
  { key: 'hallucinated', emoji: '👻', label: 'Hallucinated citations',  blurb: "AI invented these — they don't exist." },
] as const

export default function ResultsScreen({ player, result, onSeeNexus, onPlayAgain }: Props) {
  const survived = Math.floor(GAME_DURATION_S - result.timeRemaining)
  const fullRun = result.endedBy === 'time' && result.hits < 3

  const totalDodged =
    result.stats.preprint_dodged +
    result.stats.paywalled_dodged +
    result.stats.predatory_dodged +
    result.stats.hallucinated_dodged
  const totalHit =
    result.stats.preprint_hit +
    result.stats.paywalled_hit +
    result.stats.predatory_hit +
    result.stats.hallucinated_hit

  return (
    <div className="absolute inset-0 flex items-stretch text-white bg-neutral-950">
      {/* Left column ~60% */}
      <div className="basis-3/5 grow flex flex-col justify-center p-8 md:p-12 overflow-y-auto">
        <div className="text-xs uppercase tracking-[0.3em] text-purple-300/80">
          {player.name}{player.institution ? ` · ${player.institution}` : ''}
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl text-neutral-300">Your score</h2>
        <div className="mt-1 font-bold tabular-nums" style={{ fontSize: 'clamp(4rem, 10vw, 7rem)', lineHeight: 1 }}>
          {result.score}
        </div>

        <div className="mt-4 text-neutral-300">
          {fullRun
            ? <>Survived <strong>60 seconds — full run!</strong> <span className="text-purple-300">+200 bonus</span></>
            : <>Survived <strong>{survived} seconds</strong></>
          }
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg">
          <Stat label="Trusted collected"  value={result.stats.trusted_collected} />
          <Stat label="Bad citations dodged" value={totalDodged} />
          <Stat label="Bad citations hit"  value={totalHit} />
        </div>

        <h3 className="mt-8 text-sm uppercase tracking-widest text-neutral-400">Citation breakdown</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          {badTypeMeta.map(t => {
            const dodged = result.stats[`${t.key}_dodged` as const]
            const hit    = result.stats[`${t.key}_hit` as const]
            return (
              <div key={t.key} className="rounded-xl border border-white/10 bg-neutral-900 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold">
                    <span className="mr-2">{t.emoji}</span>{t.label}
                  </div>
                  <div className="text-xs text-neutral-400 tabular-nums">
                    <span className="text-green-400">{dodged} dodged</span>
                    {hit > 0 && <span className="text-red-400 ml-2">{hit} hit</span>}
                  </div>
                </div>
                <p className="mt-1 text-xs text-neutral-400 italic">{t.blurb}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right column ~40% — purple panel */}
      <div className="basis-2/5 shrink-0 flex flex-col justify-center p-8 md:p-12 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900">
        <h3 className="font-bold tracking-tight" style={{ fontSize: 'clamp(1.75rem, 3.4vw, 2.75rem)', lineHeight: 1.1 }}>
          Now see how Nexus catches them all
        </h3>
        <p className="mt-4 text-purple-100/90 text-base md:text-lg">
          Nexus dodges every one of these — automatically, in seconds, every time.
        </p>
        <button
          type="button"
          onClick={onSeeNexus}
          className="mt-8 self-start px-7 py-3 rounded-full bg-white text-purple-800 hover:bg-purple-50 active:bg-purple-100 font-semibold transition-colors"
        >
          Watch it work →
        </button>

        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-4 self-start text-sm text-purple-200 hover:text-white underline underline-offset-4"
        >
          Play again
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-900 border border-white/10 p-3">
      <div className="text-xs uppercase tracking-widest text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
