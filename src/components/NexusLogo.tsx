interface Props { size?: number }

export default function NexusLogo({ size = 36 }: Props) {
  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: '#C8102E' }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.6" />
        <ellipse cx="12" cy="12" rx="4" ry="10" stroke="white" strokeWidth="1.6" />
        <line x1="2"   y1="12" x2="22"   y2="12" stroke="white" strokeWidth="1.6" />
        <line x1="4.5" y1="7"  x2="19.5" y2="7"  stroke="white" strokeWidth="1.6" />
        <line x1="4.5" y1="17" x2="19.5" y2="17" stroke="white" strokeWidth="1.6" />
      </svg>
    </div>
  )
}
