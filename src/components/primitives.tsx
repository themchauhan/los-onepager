import type { ReactNode } from 'react'
import { EMPTY } from '@/lib/format'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ */
/* Field grid — the label-above-value pattern from the LOS screens      */
/* ------------------------------------------------------------------ */

export function FieldGrid({
  children,
  cols = 4,
}: {
  children: ReactNode
  cols?: 2 | 3 | 4
}) {
  const map = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  } as const
  return (
    <div className={cx('grid grid-cols-1 gap-x-6 gap-y-5', map[cols])}>
      {children}
    </div>
  )
}

export function Field({
  label,
  value,
  hint,
  mono,
  span,
}: {
  label: string
  value: ReactNode
  hint?: string
  mono?: boolean
  span?: boolean
}) {
  const isEmpty = value === EMPTY || value === '' || value == null
  return (
    <div className={cx('min-w-0', span && 'sm:col-span-2 lg:col-span-4')}>
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={cx(
          'break-words text-sm leading-snug',
          mono && 'tnum font-medium',
          isEmpty ? 'text-slate-300' : 'text-slate-900',
        )}
      >
        {isEmpty ? EMPTY : value}
      </dd>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

/** A checkbox-style boolean, matching the tick marks in the source screens. */
export function BoolField({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="flex items-center gap-2 text-sm">
        <span
          className={cx(
            'inline-flex h-4 w-4 items-center justify-center rounded border',
            value
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white',
          )}
          aria-hidden
        >
          {value && (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
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
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value ? 'Yes' : 'No'}
        </span>
      </dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */

export function Section({
  title,
  subtitle,
  actions,
  children,
  tone = 'default',
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  tone?: 'default' | 'muted'
}) {
  return (
    <section
      className={cx(
        'overflow-hidden rounded-xl border border-slate-200 shadow-sm',
        tone === 'muted' ? 'bg-slate-50' : 'bg-white',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Pills                                                               */
/* ------------------------------------------------------------------ */

const STATUS_TONE: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Submitted: 'bg-sky-50 text-sky-700 ring-sky-200',
  'Under Review': 'bg-amber-50 text-amber-700 ring-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  Disbursed: 'bg-violet-50 text-violet-700 ring-violet-200',
  'On Hold': 'bg-orange-50 text-orange-700 ring-orange-200',
}

const RISK_TONE: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  HIGH: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export function Pill({
  children,
  tone,
}: {
  children: ReactNode
  tone?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap',
        tone ?? 'bg-slate-100 text-slate-700 ring-slate-200',
      )}
    >
      {children}
    </span>
  )
}

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={STATUS_TONE[status]}>{status}</Pill>
}

export function RiskPill({ risk }: { risk: string }) {
  return <Pill tone={RISK_TONE[risk]}>{risk}</Pill>
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled,
  type = 'button',
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  title?: string
}) {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300 shadow-sm',
    secondary:
      'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-300',
    danger:
      'bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50',
  } as const
  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-9 px-3.5 text-sm gap-1.5',
  } as const

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cx('animate-spin', className ?? 'h-4 w-4')}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  )
}

export function SkeletonRows({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <div
                className="h-3 animate-pulse rounded bg-slate-200"
                style={{ width: `${45 + ((r * 7 + c * 13) % 45)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
