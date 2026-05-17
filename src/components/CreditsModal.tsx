import { CREDITS } from '../data/credits'

interface Props { onClose: () => void }

export default function CreditsModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
      onPointerDown={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-purple-700/80 font-semibold">Credits</div>
            <h3 className="text-lg font-bold text-gray-900">Third-party assets</h3>
          </div>
          <button
            type="button"
            onPointerDown={onClose}
            className="text-gray-400 hover:text-gray-800 text-2xl leading-none"
            aria-label="Close credits"
          >×</button>
        </div>

        <ul className="px-6 py-4 divide-y divide-gray-100">
          {CREDITS.map((c) => (
            <li key={`${c.asset}-${c.author}`} className="py-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-900">{c.asset}</span>{' '}
                <span className="text-gray-500">by {c.author}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gray-800"
                >
                  {c.source_url}
                </a>
                {' · '}
                <a
                  href={c.license_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gray-800"
                >
                  {c.license}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
