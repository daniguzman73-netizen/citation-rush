import { useState, useMemo, useRef } from 'react'
import { searchInstitutions, OTHER_OPTION_LABEL } from '../data/institutions'
import type { PlayerInfo } from '../types'

interface Props {
  initial?: PlayerInfo
  onSubmit: (info: PlayerInfo) => void
  onBack: () => void
}

export default function IntakeScreen({ initial, onSubmit, onBack }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [optedIn, setOptedIn] = useState(initial?.optedIn ?? false)
  const [institutionFocused, setInstitutionFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const trimmedInstitution = institution.trim()
  const suggestions = useMemo(
    () => (trimmedInstitution ? searchInstitutions(trimmedInstitution, 8) : []),
    [trimmedInstitution],
  )
  const showSuggestions = institutionFocused && trimmedInstitution.length > 0

  const canSubmit = name.trim().length > 0 && institution.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      institution: institution.trim(),
      email: email.trim(),
      optedIn,
      anonymous: false,
    })
  }

  const handleSkip = () => {
    onSubmit({
      name: 'Guest',
      institution: '',
      email: '',
      optedIn: false,
      anonymous: true,
    })
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-neutral-900/80 backdrop-blur rounded-2xl p-8 border border-white/10 shadow-2xl"
      >
        <h2 className="text-3xl font-bold tracking-tight">Before you run</h2>
        <p className="mt-2 text-sm text-neutral-400">Two quick fields, then we go.</p>

        <label className="block mt-6 text-sm font-medium text-neutral-300">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="off"
            placeholder="Your name"
            className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <div className="block mt-4 text-sm font-medium text-neutral-300">
          <label htmlFor="institution-input">Institution</label>
          <div className="relative mt-1">
            {/* search icon (left) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              id="institution-input"
              ref={inputRef}
              type="text"
              required
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              onFocus={() => setInstitutionFocused(true)}
              onBlur={() => setTimeout(() => setInstitutionFocused(false), 120)}
              autoComplete="off"
              placeholder="Start typing your institution…"
              className="w-full rounded-lg bg-neutral-800 border border-white/10 pl-9 pr-9 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* clear (right) */}
            {institution.length > 0 && (
              <button
                type="button"
                aria-label="Clear institution"
                onMouseDown={(e) => { e.preventDefault(); setInstitution(''); inputRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            )}

            {showSuggestions && (
              <ul className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg bg-neutral-800 border border-white/10 shadow-xl z-10">
                {suggestions.map(s => (
                  <li key={s.unitid}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setInstitution(s.name); setInstitutionFocused(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-purple-600/30 transition-colors flex items-baseline justify-between gap-3"
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-xs text-neutral-500 shrink-0">{s.state}</span>
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && (
                  <li className="px-3 py-2 text-xs text-neutral-500 italic">No matches</li>
                )}
                <li className="border-t border-white/5">
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setInstitutionFocused(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-300 italic hover:bg-purple-600/30 transition-colors"
                  >
                    {OTHER_OPTION_LABEL}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        <label className="block mt-4 text-sm font-medium text-neutral-300">
          Email <span className="text-neutral-500 font-normal">(optional)</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="off"
            placeholder="you@library.edu"
            className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </label>

        <label className="mt-4 flex items-start gap-3 text-sm text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={e => setOptedIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-neutral-800 text-purple-500 focus:ring-purple-500"
          />
          <span>Send me Nexus updates</span>
        </label>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-neutral-400 hover:text-neutral-200 underline underline-offset-4 transition-colors"
            >
              Skip →
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-base font-semibold transition-colors"
            >
              Let's run →
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500 text-right">
          Skip plays a run without saving to the leaderboard.
        </p>
      </form>
    </div>
  )
}
