import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { Spinner, cx } from '@/components/primitives'
import { currencyShort, number } from '@/lib/format'

const STATUS_TONE: Record<string, string> = {
  Draft: 'bg-slate-400',
  Submitted: 'bg-sky-500',
  'Under Review': 'bg-amber-500',
  Approved: 'bg-emerald-500',
  Rejected: 'bg-rose-500',
  Disbursed: 'bg-violet-500',
  'On Hold': 'bg-orange-500',
}

const RISK_TONE: Record<string, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-rose-500',
}

function Bars({
  data,
  tones,
  total,
  hrefKey,
}: {
  data: Record<string, number>
  tones: Record<string, string>
  total: number
  hrefKey: 'status' | 'risk'
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <ul className="space-y-2.5">
      {entries.map(([label, value]) => (
        <li key={label}>
          <Link
            to={`/?${hrefKey}=${encodeURIComponent(label)}`}
            className="group block"
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-700 group-hover:text-brand-700">{label}</span>
              <span className="tnum shrink-0 text-slate-500">
                {number(value)}
                <span className="ml-1.5 text-xs text-slate-400">
                  {((value / total) * 100).toFixed(1)}%
                </span>
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cx('h-full rounded-full transition-all', tones[label] ?? 'bg-slate-400')}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Dashboard() {
  const { data: stats, isPending } = useQuery({ queryKey: ['stats'], queryFn: api.getStats })

  if (isPending || !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Spinner className="h-6 w-6" />
        <span className="ml-3 text-sm">Aggregating portfolio…</span>
      </div>
    )
  }

  const approved = stats.byStatus['Approved'] ?? 0
  const disbursed = stats.byStatus['Disbursed'] ?? 0
  const rejected = stats.byStatus['Rejected'] ?? 0
  const decided = approved + disbursed + rejected

  const cards = [
    { label: 'Total applications', value: number(stats.total), sub: 'in the corpus' },
    { label: 'Book value', value: currencyShort(stats.totalBookValue), sub: 'sum of sanctioned amounts' },
    {
      label: 'Approval rate',
      value: decided ? `${(((approved + disbursed) / decided) * 100).toFixed(1)}%` : '—',
      sub: `${number(decided)} decided`,
    },
    {
      label: 'High risk',
      value: number(stats.byRisk['HIGH'] ?? 0),
      sub: `${(((stats.byRisk['HIGH'] ?? 0) / stats.total) * 100).toFixed(1)}% of portfolio`,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Portfolio dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Aggregates computed across all {number(stats.total)} records. Click any
          bar to open the filtered list.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {c.label}
            </span>
            <span className="tnum mt-1 block text-2xl font-semibold text-slate-900">
              {c.value}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-400">{c.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">By status</h2>
          <Bars data={stats.byStatus} tones={STATUS_TONE} total={stats.total} hrefKey="status" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">By risk category</h2>
          <Bars data={stats.byRisk} tones={RISK_TONE} total={stats.total} hrefKey="risk" />
        </section>
      </div>
    </div>
  )
}
