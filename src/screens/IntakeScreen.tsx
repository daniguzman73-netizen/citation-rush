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
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-[#F3F4F6]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white rounded-2xl p-8 border border-gray-200 shadow-xl"
      >
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Before you run</h2>
        <p className="mt-2 text-sm text-gray-500">Quick details before we go.</p>

        <label className="block mt-6 text-sm font-medium text-gray-700">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="off"
            placeholder="Your name"
            className="mt-1 w-full rounded-lg bg-gray-50 border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </label>

        <div className="block mt-4 text-sm font-medium text-gray-700">
          <label htmlFor="institution-input">Institution</label>
          <div className="relative mt-1">
            {/* search icon (left) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
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
              className="w-full rounded-lg bg-gray-50 border border-gray-300 pl-9 pr-9 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            {/* clear (right) */}
            {institution.length > 0 && (
              <button
                type="button"
                aria-label="Clear institution"
                onMouseDown={(e) => { e.preventDefault(); setInstitution(''); inputRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            )}

            {showSuggestions && (
              <ul className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg bg-white border border-gray-200 shadow-xl z-10">
                {suggestions.map(s => (
                  <li key={s.unitid}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setInstitution(s.name); setInstitutionFocused(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-purple-50 transition-colors flex items-baseline justify-between gap-3"
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">{s.state}</span>
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && (
                  <li className="px-3 py-2 text-xs text-gray-400 italic">No matches</li>
                )}
                <li className="border-t border-gray-100">
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setInstitutionFocused(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-500 italic hover:bg-purple-50 transition-colors"
                  >
                    {OTHER_OPTION_LABEL}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        <label className="block mt-4 text-sm font-medium text-gray-700">
          Email <span className="text-gray-400 font-normal">(optional)</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="off"
            placeholder="you@library.edu"
            className="mt-1 w-full rounded-lg bg-gray-50 border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </label>

        <label className="mt-4 flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={e => setOptedIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500"
          />
          <span>Send me Nexus updates</span>
        </label>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
            >
              Skip →
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-base font-semibold transition-colors"
            >
              Let's run →
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400 text-right">
          Skip plays a run without saving to the leaderboard.
        </p>
      </form>
    </div>
  )
}
