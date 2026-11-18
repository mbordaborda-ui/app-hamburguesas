import { useDb } from '@/store/db'

export function AnnouncementBar() {
  const text = useDb((s) => s.settings.announcement)

  return (
    <div className="relative overflow-hidden border-b border-red/20 bg-red text-white">
      <div className="flex w-max animate-marquee items-center gap-8 py-1.5 will-change-transform">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-8 pr-8">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider"
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
