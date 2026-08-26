import { useMemo, useState } from 'react'
import type { Application, MatchParameter } from '@/api'
import { Pill, EmptyState, cx } from '@/components/primitives'
import { EMPTY, currency, date, number, text } from '@/lib/format'

const PARAM_LABELS: Record<MatchParameter, string> = {
  name: 'Name',
  dob: 'DOB',
  pan: 'PAN',
  mobile: 'Mobile',
  address: 'Address',
  bankAccountNo: 'Bank Accnt. No.',
  aadhaar: 'Aadhaar',
  voterIdDlPassport: 'Voter Id / DL / Passport',
  customerAddress: 'Customer Address',
  customerName: 'Customer Name',
}

const ALL_PARAMS = Object.keys(PARAM_LABELS) as MatchParameter[]

/** The source fields each match parameter compares. */
const PARAM_FIELD: Partial<Record<MatchParameter, 'customerName' | 'dob' | 'pan' | 'mobile' | 'permanentAddress'>> = {
  name: 'customerName',
  dob: 'dob',
  pan: 'pan',
  mobile: 'mobile',
  address: 'permanentAddress',
}

function Panel({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Match card — replaces the horizontally-scrolling green-cell grid     */
/* ------------------------------------------------------------------ */

function MatchCard({
  app,
  match,
  activeParams,
  rank,
}: {
  app: Application
  match: Application['dedupe']['matches'][number]
  activeParams: MatchParameter[]
  rank: number
}) {
  const source = app.dedupe.currentCustomer

  const comparisons = activeParams
    .filter((p) => PARAM_FIELD[p])
    .map((p) => {
      const field = PARAM_FIELD[p]!
      const fmt = field === 'dob' ? date : text
      const sourceValue = fmt(source[field])
      const matchValue = fmt(match[field])
      const declared = match.matchedFields.includes(p)
      // Trust the values over the flag: an engine can claim a fuzzy hit, but
      // labelling two visibly different values "Match" is never right.
      const kind: 'exact' | 'fuzzy' | 'none' =
        sourceValue !== EMPTY && sourceValue === matchValue
          ? 'exact'
          : declared
            ? 'fuzzy'
            : 'none'
      return { param: p, label: PARAM_LABELS[p], sourceValue, matchValue, kind }
    })

  const hits = comparisons.filter((c) => c.kind !== 'none').length
  const score = comparisons.length ? Math.round((hits / comparisons.length) * 100) : 0
  const strength = score >= 75 ? 'Strong' : score >= 40 ? 'Partial' : 'Weak'
  const tone =
    strength === 'Strong'
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : strength === 'Partial'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200'

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">
            {rank}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {match.customerName}
          </span>
          <span className="tnum text-xs text-slate-500">
            Customer ID {match.customerId}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {match.isMfi === 'Yes' && (
            <Pill tone="bg-violet-50 text-violet-700 ring-violet-200">MFI</Pill>
          )}
          {match.isParallel === 'Yes' && (
            <Pill tone="bg-rose-50 text-rose-700 ring-rose-200">
              Parallel application
            </Pill>
          )}
          <Pill tone={tone}>
            {strength} · {hits}/{comparisons.length} matched
          </Pill>
        </div>
      </div>

      {/* Strength meter */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className={cx(
            'h-full transition-all',
            strength === 'Strong'
              ? 'bg-rose-500'
              : strength === 'Partial'
                ? 'bg-amber-500'
                : 'bg-slate-300',
          )}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="w-28 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Parameter
              </th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                This application
              </th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Matched record
              </th>
              <th className="w-24 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => (
              <tr key={c.param} className="border-b border-slate-50 last:border-0">
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                  {c.label}
                </th>
                <td className="px-4 py-2 text-slate-700">{c.sourceValue}</td>
                <td
                  className={cx(
                    'px-4 py-2',
                    c.kind === 'exact'
                      ? 'bg-emerald-50/70 font-medium text-emerald-900'
                      : c.kind === 'fuzzy'
                        ? 'bg-amber-50/70 font-medium text-amber-900'
                        : 'text-slate-500',
                  )}
                >
                  {c.matchValue}
                </td>
                <td className="px-4 py-2">
                  {c.kind === 'exact' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckIcon /> Exact
                    </span>
                  ) : c.kind === 'fuzzy' ? (
                    <span className="text-xs font-medium text-amber-700">Fuzzy</span>
                  ) : (
                    <span className="text-xs text-slate-400">No match</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-tab tables                                                      */
/* ------------------------------------------------------------------ */

function Table({
  head,
  children,
  minWidth = 720,
}: {
  head: string[]
  children: React.ReactNode
  minWidth?: number
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function DpdPill({ dpd }: { dpd: number }) {
  if (dpd === 0) return <Pill tone="bg-emerald-50 text-emerald-700 ring-emerald-200">0</Pill>
  if (dpd < 30) return <Pill tone="bg-amber-50 text-amber-700 ring-amber-200">{dpd}</Pill>
  return <Pill tone="bg-rose-50 text-rose-700 ring-rose-200">{dpd}</Pill>
}

/* ------------------------------------------------------------------ */

const SUB_TABS = [
  { key: 'source', label: 'Source and Target' },
  { key: 'family', label: 'Family Dedupe' },
  { key: 'exposure', label: 'BFL Exposure' },
  { key: 'track', label: 'BFL Track Records' },
] as const

export default function DedupeTab({ app }: { app: Application }) {
  const [sub, setSub] = useState<(typeof SUB_TABS)[number]['key']>('source')
  const [activeParams, setActiveParams] = useState<MatchParameter[]>(
    app.dedupe.matchingParameters,
  )

  const counts = {
    source: app.dedupe.matches.length,
    family: app.dedupe.familyDedupe.length,
    exposure: app.dedupe.bflExposure.length,
    track: app.dedupe.bflTrackRecords.length,
  }

  const sortedMatches = useMemo(
    () =>
      [...app.dedupe.matches].sort(
        (a, b) => b.matchedFields.length - a.matchedFields.length,
      ),
    [app.dedupe.matches],
  )

  const source = app.dedupe.currentCustomer

  return (
    <div className="space-y-4">
      {/* Source record --------------------------------------------------- */}
      <Panel
        title="Current Customer Detail"
        subtitle="The record every dedupe candidate below is compared against"
      >
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['Customer ID', source.customerId, true],
              ['Customer Name', source.customerName, false],
              ['DOB', date(source.dob), true],
              ['Mobile', source.mobile, true],
              ['PAN', source.pan, true],
              ['Bank Account No.', source.bankAccountNo, true],
              ['Aadhaar', source.aadhaar, true],
              ['OVD Details', source.ovdDetails, false],
            ] as Array<[string, string, boolean]>
          ).map(([label, value, mono]) => (
            <div key={label} className="min-w-0">
              <dt className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className={cx('break-words text-sm font-medium text-slate-900', mono && 'tnum')}>
                {text(value)}
              </dd>
            </div>
          ))}
          <div className="min-w-0 sm:col-span-2 lg:col-span-2">
            <dt className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Current Residence Address
            </dt>
            <dd className="text-sm text-slate-800">{text(source.currentResidenceAddress)}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2 lg:col-span-2">
            <dt className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Permanent Address
            </dt>
            <dd className="text-sm text-slate-800">{text(source.permanentAddress)}</dd>
          </div>
        </dl>
      </Panel>

      {/* Matching parameters --------------------------------------------- */}
      <Panel
        title="Matching Parameters"
        subtitle="Toggle a parameter to re-score every candidate below"
      >
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {ALL_PARAMS.map((p) => {
            const on = activeParams.includes(p)
            const supported = Boolean(PARAM_FIELD[p])
            return (
              <button
                key={p}
                disabled={!supported}
                onClick={() =>
                  setActiveParams((prev) =>
                    prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
                  )
                }
                title={supported ? undefined : 'Not available in this dataset'}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  !supported
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                    : on
                      ? 'border-brand-300 bg-brand-50 text-brand-800'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <span
                  className={cx(
                    'grid h-3.5 w-3.5 place-items-center rounded border',
                    on && supported
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {on && supported && <CheckIcon small />}
                </span>
                {PARAM_LABELS[p]}
              </button>
            )
          })}
        </div>
      </Panel>

      {/* Sub-tabs -------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cx(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              sub === t.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {t.label}
            <span
              className={cx(
                'tnum rounded-full px-1.5 py-0.5 text-[10px]',
                sub === t.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500',
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {sub === 'source' && (
        <Panel
          title="Dedupe Detail (Customer CF)"
          subtitle={`${sortedMatches.length} candidate${sortedMatches.length === 1 ? '' : 's'}, strongest first`}
        >
          <div className="space-y-3 px-5 py-4">
            {sortedMatches.length === 0 ? (
              <EmptyState
                title="No dedupe matches"
                description="No existing customer record matches on the selected parameters."
              />
            ) : (
              sortedMatches.map((m, i) => (
                <MatchCard
                  key={m.customerId + i}
                  app={app}
                  match={m}
                  activeParams={activeParams}
                  rank={i + 1}
                />
              ))
            )}
          </div>
        </Panel>
      )}

      {sub === 'family' && (
        <Panel title="Family Dedupe" subtitle="Linked family records and their exposure">
          {app.dedupe.familyDedupe.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No family records linked" />
            </div>
          ) : (
            <Table
              head={['Customer ID', 'Name', 'Relationship', 'Mobile', 'PAN', 'Active Loans', 'Outstanding', 'Worst DPD']}
            >
              {app.dedupe.familyDedupe.map((f) => (
                <tr key={f.customerId} className="border-b border-slate-100 last:border-0">
                  <td className="tnum px-4 py-2.5 text-slate-700">{f.customerId}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{f.customerName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{f.relationship}</td>
                  <td className="tnum px-4 py-2.5 text-slate-600">{f.mobile}</td>
                  <td className="tnum px-4 py-2.5 text-slate-600">{f.pan}</td>
                  <td className="tnum px-4 py-2.5 text-slate-700">{f.activeLoans}</td>
                  <td className="tnum px-4 py-2.5 text-slate-900">{currency(f.totalOutstanding)}</td>
                  <td className="px-4 py-2.5"><DpdPill dpd={f.worstDpd} /></td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      )}

      {sub === 'exposure' && (
        <Panel title="BFL Exposure" subtitle="Existing Bajaj Finance loans for this customer">
          {app.dedupe.bflExposure.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No existing BFL exposure" />
            </div>
          ) : (
            <Table head={['Loan Account No.', 'Product', 'Sanctioned', 'Outstanding', 'EMI', 'Disbursal Date', 'Status']}>
              {app.dedupe.bflExposure.map((e) => (
                <tr key={e.loanAccountNo} className="border-b border-slate-100 last:border-0">
                  <td className="tnum px-4 py-2.5 font-medium text-slate-900">{e.loanAccountNo}</td>
                  <td className="px-4 py-2.5 text-slate-600">{e.product}</td>
                  <td className="tnum px-4 py-2.5 text-slate-700">{currency(e.sanctionedAmount)}</td>
                  <td className="tnum px-4 py-2.5 text-slate-900">{currency(e.outstanding)}</td>
                  <td className="tnum px-4 py-2.5 text-slate-700">{currency(e.emi)}</td>
                  <td className="tnum px-4 py-2.5 text-slate-500">{date(e.disbursalDate)}</td>
                  <td className="px-4 py-2.5">
                    <Pill
                      tone={
                        e.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700 ring-rose-200'
                          : e.status === 'Active'
                            ? 'bg-sky-50 text-sky-700 ring-sky-200'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                      }
                    >
                      {e.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      )}

      {sub === 'track' && (
        <Panel title="BFL Track Records" subtitle="Repayment behaviour on prior BFL loans">
          {app.dedupe.bflTrackRecords.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No prior BFL track record" />
            </div>
          ) : (
            <Table head={['Loan Account No.', 'Product', 'EMIs Paid', 'EMIs Bounced', 'Current DPD', 'Max DPD', 'Closure Type']}>
              {app.dedupe.bflTrackRecords.map((t) => (
                <tr key={t.loanAccountNo} className="border-b border-slate-100 last:border-0">
                  <td className="tnum px-4 py-2.5 font-medium text-slate-900">{t.loanAccountNo}</td>
                  <td className="px-4 py-2.5 text-slate-600">{t.product}</td>
                  <td className="tnum px-4 py-2.5 text-slate-700">{number(t.emisPaid)}</td>
                  <td className="tnum px-4 py-2.5 text-slate-700">
                    {t.emisBounced > 0 ? (
                      <span className="font-medium text-amber-700">{t.emisBounced}</span>
                    ) : (
                      t.emisBounced
                    )}
                  </td>
                  <td className="px-4 py-2.5"><DpdPill dpd={t.currentDpd} /></td>
                  <td className="px-4 py-2.5"><DpdPill dpd={t.maxDpd} /></td>
                  <td className="px-4 py-2.5 text-slate-600">{t.closureType || EMPTY}</td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      )}
    </div>
  )
}

function CheckIcon({ small }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={small ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
