import type { Application } from '@/api'
import { DataSection, type FieldDef } from '@/components/DataSection'
import { Pill, RiskPill, StatusPill, cx } from '@/components/primitives'
import { currency, date, number, percent } from '@/lib/format'
import { PRODUCT_LABEL } from '@/mock/reference'

const LOAN_FIELDS: FieldDef[] = [
  { key: 'loanAmount', label: 'Sanctioned Loan Amount', type: 'currency', mono: true },
  { key: 'requestedLoanAmount', label: 'Requested Loan Amount', type: 'currency', mono: true },
  { key: 'requestedLoanTenorMonths', label: 'Requested Loan Tenor (Months)', type: 'number', mono: true },
  { key: 'approvedTenorMonths', label: 'Approved Tenor (Months)', type: 'number', mono: true },

  { key: 'interestRatePct', label: 'Interest Rate (%)', type: 'number', mono: true },
  { key: 'emi', label: 'EMI', type: 'currency', mono: true, editable: false },
  { key: 'processingFee', label: 'Processing Fee', type: 'currency', mono: true },
  { key: 'schemeCode', label: 'Scheme Code', mono: true },

  { key: 'uwProcessType', label: 'U/W Process Type', type: 'select', options: ['Full U/W', 'Straight Through', 'Partial U/W'] },
  { key: 'offerEmploymentType', label: 'Offer Employment Type', type: 'select', options: ['Salaried', 'Self Employed', 'Professional'] },
  { key: 'eligibleLtv', label: 'Eligible LTV (%)', type: 'number', mono: true },
  { key: 'recommendedLtv', label: 'Recommended LTV (%)', type: 'number', mono: true },

  { key: 'dealerRanking', label: 'Dealer Ranking', type: 'number', mono: true },
  {
    key: 'businessEmploymentVerified',
    label: 'Business / Employment Verified',
    type: 'select',
    options: ['Yes', 'No'],
    flag: (v) => (v ? null : 'Verification outstanding'),
  },
  { key: 'creditManager', label: 'Credit Manager' },
  {
    key: 'riskCategory',
    label: 'Risk Category',
    type: 'select',
    options: ['LOW', 'MEDIUM', 'HIGH'],
    render: (v) => <RiskPill risk={String(v)} />,
  },

  { key: 'branch', label: 'Branch', mono: false },
  { key: 'sourcingChannel', label: 'Sourcing Channel', type: 'select', options: ['Direct', 'DSA', 'Dealer', 'Digital', 'Branch Walk-in'] },
  { key: 'disbursalStatus', label: 'Disbursal Status', editable: false },
  { key: 'expectedDisbursalDate', label: 'Expected Disbursal Date', type: 'date', mono: true },
]

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className={cx('tnum mt-1 block text-lg font-semibold', tone ?? 'text-slate-900')}>
        {value}
      </span>
      {sub && <span className="mt-0.5 block text-[11px] text-slate-400">{sub}</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Workflow progress                                                   */
/* ------------------------------------------------------------------ */

const STAGE_TONE = {
  complete: 'bg-emerald-500',
  'in-progress': 'bg-brand-500',
  flagged: 'bg-rose-500',
  pending: 'bg-slate-200',
} as const

function WorkflowProgress({ app }: { app: Application }) {
  const done = app.workflow.filter((s) => s.status === 'complete').length
  const flagged = app.workflow.filter((s) => s.status === 'flagged')

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Workflow progress</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {done} of {app.workflow.length} stages complete
            {flagged.length > 0 && (
              <> · {flagged.map((f) => f.label).join(', ')} flagged</>
            )}
          </p>
        </div>
        <span className="tnum text-lg font-semibold text-slate-900">
          {Math.round((done / app.workflow.length) * 100)}%
        </span>
      </div>

      <div className="mt-4 flex gap-1">
        {app.workflow.map((s) => (
          <div
            key={s.key}
            title={`${s.label} — ${s.status}`}
            className={cx('h-2 flex-1 rounded-full', STAGE_TONE[s.status])}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {app.workflow.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', STAGE_TONE[s.status])} />
            <span
              className={cx(
                'truncate',
                s.status === 'complete'
                  ? 'text-slate-500'
                  : s.status === 'flagged'
                    ? 'font-medium text-rose-700'
                    : s.status === 'in-progress'
                      ? 'font-medium text-brand-700'
                      : 'text-slate-400',
              )}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

export default function LoanTab({ app }: { app: Application }) {
  const l = app.loan
  const totalPayable = l.emi * (l.approvedTenorMonths ?? l.requestedLoanTenorMonths)
  const totalInterest = totalPayable - l.loanAmount

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Sanctioned amount"
          value={currency(l.loanAmount)}
          sub={`Requested ${currency(l.requestedLoanAmount)}`}
        />
        <Metric
          label="EMI"
          value={currency(l.emi)}
          sub={`${l.approvedTenorMonths ?? l.requestedLoanTenorMonths} months @ ${percent(l.interestRatePct)}`}
        />
        <Metric
          label="Total interest"
          value={currency(totalInterest)}
          sub={`Total payable ${currency(totalPayable)}`}
          tone="text-amber-700"
        />
        <Metric
          label="Processing fee"
          value={currency(l.processingFee)}
          sub={`${((l.processingFee / l.loanAmount) * 100).toFixed(2)}% of sanction`}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Application summary</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill status={app.status} />
          <RiskPill risk={l.riskCategory} />
          <Pill>{app.product} · {PRODUCT_LABEL[app.product]}</Pill>
          <Pill>{l.uwProcessType}</Pill>
          <Pill>{l.offerEmploymentType}</Pill>
          <Pill>{l.sourcingChannel}</Pill>
          <Pill>Dealer rank {number(l.dealerRanking)}</Pill>
          <Pill
            tone={
              l.disbursalStatus === 'Disbursed'
                ? 'bg-violet-50 text-violet-700 ring-violet-200'
                : undefined
            }
          >
            {l.disbursalStatus}
          </Pill>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Managed by {l.creditManager} at {l.branch} · created {date(app.createdAt)} ·
          expected disbursal {date(l.expectedDisbursalDate)}
        </p>
      </section>

      <WorkflowProgress app={app} />

      <DataSection
        title="Loan Details"
        fields={LOAN_FIELDS}
        values={l as unknown as Record<string, unknown>}
        record={app}
        section="loan"
      />
    </div>
  )
}
