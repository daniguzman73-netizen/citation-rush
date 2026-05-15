import { useState, useMemo, useRef } from 'react'
import { INSTITUTIONS } from '../data/institutions'
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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const suggestions = useMemo(() => {
    if (!institution.trim()) return INSTITUTIONS.slice(0, 8)
    const q = institution.toLowerCase()
    return INSTITUTIONS.filter(i => i.toLowerCase().includes(q)).slice(0, 8)
  }, [institution])

  const canSubmit = name.trim().length > 0 && institution.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ name: name.trim(), institution: institution.trim(), email: email.trim(), optedIn })
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

        <label className="block mt-4 text-sm font-medium text-neutral-300 relative">
          Institution
          <input
            ref={inputRef}
            type="text"
            required
            value={institution}
            onChange={e => { setInstitution(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            autoComplete="off"
            placeholder="Start typing your institution…"
            className="mt-1 w-full rounded-lg bg-neutral-800 border border-white/10 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-neutral-800 border border-white/10 shadow-xl z-10">
              {suggestions.map(s => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={() => { setInstitution(s); setShowSuggestions(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-600/30 transition-colors"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>

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
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-base font-semibold transition-colors"
          >
            Let's run →
          </button>
        </div>
      </form>
    </div>
  )
}
