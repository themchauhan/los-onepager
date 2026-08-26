import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import type { Application } from '@/api'
import {
  Button,
  EmptyState,
  Pill,
  RiskPill,
  Spinner,
  StatusPill,
  cx,
} from '@/components/primitives'
import { ViewOptionsProvider } from '@/components/DataSection'
import { useDebounce } from '@/hooks/useDebounce'
import { currency, currencyShort, date, number, percent } from '@/lib/format'
import { deriveExceptions, type Exception, type Severity } from '@/lib/exceptions'
import { PRODUCT_LABEL } from '@/mock/reference'

import BasicDetailsTab from './tabs/BasicDetailsTab'
import AddressesTab from './tabs/AddressesTab'
import DedupeTab from './tabs/DedupeTab'
import AssetTab from './tabs/AssetTab'
import LoanTab from './tabs/LoanTab'

const TABS = [
  { key: 'basic', label: 'Basic Details' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'dedupe', label: 'Dedupe' },
  { key: 'asset', label: 'Asset & Vahan' },
  { key: 'loan', label: 'Loan Details' },
] as const

type TabKey = (typeof TABS)[number]['key']

const SEVERITY_STYLE: Record<Severity, { dot: string; chip: string; label: string }> = {
  critical: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-800 ring-rose-200 hover:bg-rose-100',
    label: 'Critical',
  },
  warning: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100',
    label: 'Warning',
  },
  info: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-800 ring-sky-200 hover:bg-sky-100',
    label: 'Info',
  },
}

export default function ApplicationDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const tab = (params.get('tab') ?? 'basic') as TabKey
  const [showEmpty, setShowEmpty] = useState(false)
  const [queryInput, setQueryInput] = useState('')
  const query = useDebounce(queryInput, 200)

  const { data: app, isPending, isError, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.getApplication(id),
  })

  const exceptions = useMemo(() => (app ? deriveExceptions(app) : []), [app])

  function setTab(next: TabKey) {
    const merged = new URLSearchParams(params)
    merged.set('tab', next)
    setParams(merged, { replace: true })
  }

  // Alt+1..5 jumps between tabs; "/" focuses the field search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')

      if (e.key === '/' && !typing) {
        e.preventDefault()
        document.getElementById('field-search')?.focus()
        return
      }
      if (e.key === 'Escape' && typing) {
        ;(target as HTMLInputElement).blur()
        return
      }
      if (e.altKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault()
        setTab(TABS[Number(e.key) - 1].key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Spinner className="h-6 w-6" />
        <span className="ml-3 text-sm">Loading application…</span>
      </div>
    )
  }

  if (isError || !app) {
    return (
      <div className="py-16">
        <EmptyState
          title="Application not found"
          description={(error as Error)?.message ?? id}
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/')}>Back to applications</Button>
        </div>
      </div>
    )
  }

  return (
    <ViewOptionsProvider value={{ showEmpty, query }}>
      <div className="space-y-4">
        {/* Sticky context header — the applicant never scrolls out of view.
            In the source screens you lose track of whose record you're in as
            soon as you scroll past the top of a tab. */}
        <div className="sticky top-14 z-20 -mx-4 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/"
                  className="text-xs font-medium text-slate-400 hover:text-brand-600"
                >
                  ← Applications
                </Link>
                <span className="tnum text-xs text-slate-300">/</span>
                <span className="tnum text-xs text-slate-500">{app.applicationNo}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-semibold text-slate-900">
                  {app.applicantName}
                </h1>
                <StatusPill status={app.status} />
                <RiskPill risk={app.riskCategory} />
                <Pill>{app.product} · {PRODUCT_LABEL[app.product]}</Pill>
              </div>
            </div>

            {/* Facts that matter on every tab, pinned. */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <HeaderFact label="Amount" value={currencyShort(app.loanAmount)} />
              <HeaderFact label="EMI" value={currency(app.loan.emi)} />
              <HeaderFact
                label="Tenor"
                value={`${app.loan.approvedTenorMonths ?? app.loan.requestedLoanTenorMonths} mo`}
              />
              <HeaderFact label="ROI" value={percent(app.loan.interestRatePct)} />
              <HeaderFact label="Customer ID" value={app.customerId} />
              <HeaderFact label="Updated" value={date(app.updatedAt)} />
            </div>
          </div>

          {/* Tabs + view controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap items-center gap-1">
              {TABS.map((t, i) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  title={`Alt+${i + 1}`}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    tab === t.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {t.label}
                  {t.key === 'dedupe' && app.dedupe.matches.length > 0 && (
                    <span
                      className={cx(
                        'tnum ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                        tab === t.key ? 'bg-white/20' : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {app.dedupe.matches.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Cross-tab field search — the fastest way into a 200-field record. */}
              <div className="relative">
                <svg
                  viewBox="0 0 20 20"
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  aria-hidden
                >
                  <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  id="field-search"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Find a field…  /"
                  className="h-8 w-52 rounded-lg border border-slate-300 pl-8 pr-2 text-xs outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <button
                onClick={() => setShowEmpty((s) => !s)}
                className={cx(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                  showEmpty
                    ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    : 'border-brand-300 bg-brand-50 text-brand-800',
                )}
                title="The source screens render every blank field; hiding them shows only what's actually captured."
              >
                <span
                  className={cx(
                    'grid h-3.5 w-3.5 place-items-center rounded border',
                    !showEmpty
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {!showEmpty && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                      <path
                        d="M2.5 6.2 4.8 8.5 9.5 3.8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                Hide empty
              </button>
            </div>
          </div>

          {query && (
            <p className="mt-2 text-[11px] text-slate-500">
              Showing fields matching “{query}” across all sections of this tab —
              switch tabs to search elsewhere.
            </p>
          )}
        </div>

        {/* Exceptions strip ---------------------------------------------- */}
        <ExceptionsStrip exceptions={exceptions} onJump={(t) => setTab(t as TabKey)} />

        {/* Tab body ------------------------------------------------------ */}
        {tab === 'basic' && <BasicDetailsTab app={app} />}
        {tab === 'addresses' && <AddressesTab app={app} />}
        {tab === 'dedupe' && <DedupeTab app={app} />}
        {tab === 'asset' && <AssetTab app={app} />}
        {tab === 'loan' && <LoanTab app={app} />}

        <RecordNav app={app} />
      </div>
    </ViewOptionsProvider>
  )
}

/* ------------------------------------------------------------------ */

function HeaderFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="tnum block text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function ExceptionsStrip({
  exceptions,
  onJump,
}: {
  exceptions: Exception[]
  onJump: (tab: string) => void
}) {
  const [open, setOpen] = useState(true)

  if (exceptions.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        No exceptions flagged on this application.
      </div>
    )
  }

  const counts = {
    critical: exceptions.filter((e) => e.severity === 'critical').length,
    warning: exceptions.filter((e) => e.severity === 'warning').length,
    info: exceptions.filter((e) => e.severity === 'info').length,
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center justify-between gap-3 bg-slate-50/80 px-4 py-2.5 text-left hover:bg-slate-100"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            Needs attention
          </span>
          {(['critical', 'warning', 'info'] as const).map(
            (s) =>
              counts[s] > 0 && (
                <span
                  key={s}
                  className={cx(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                    SEVERITY_STYLE[s].chip,
                  )}
                >
                  <span className={cx('h-1.5 w-1.5 rounded-full', SEVERITY_STYLE[s].dot)} />
                  {counts[s]} {SEVERITY_STYLE[s].label.toLowerCase()}
                </span>
              ),
          )}
        </span>
        <span className="text-xs text-slate-500">
          {open ? 'Hide' : 'Show'} {exceptions.length} item
          {exceptions.length > 1 ? 's' : ''}
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-slate-100">
          {exceptions.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onJump(e.tab)}
                className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <span
                  className={cx(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    SEVERITY_STYLE[e.severity].dot,
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">
                    {e.title}
                  </span>
                  <span className="block text-xs text-slate-500">{e.detail}</span>
                </span>
                <span className="shrink-0 self-center text-[11px] font-medium text-brand-600">
                  Go to {e.tab} →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Prev / next through the corpus without bouncing back to the list. */
function RecordNav({ app }: { app: Application }) {
  const n = Number(app.id.replace('APP-', ''))
  const prev = `APP-${n - 1}`
  const next = `APP-${n + 1}`

  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-sm">
      <Link
        to={`/applications/${prev}`}
        className="text-slate-500 hover:text-brand-600"
      >
        ← Previous record
      </Link>
      <span className="tnum text-xs text-slate-400">
        Record {number(n - 100_000 + 1)}
      </span>
      <Link
        to={`/applications/${next}`}
        className="text-slate-500 hover:text-brand-600"
      >
        Next record →
      </Link>
    </div>
  )
}
