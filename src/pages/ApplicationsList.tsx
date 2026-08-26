import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/api'
import type { ApplicationStatus, ListParams, ApplicationSummary } from '@/api'
import {
  Button,
  EmptyState,
  RiskPill,
  SkeletonRows,
  Spinner,
  StatusPill,
  cx,
} from '@/components/primitives'
import { useDebounce } from '@/hooks/useDebounce'
import { currencyShort, date, number } from '@/lib/format'
import { PRODUCT_LABEL } from '@/mock/reference'

const PAGE_SIZES = [25, 50, 100]

type SortKey = keyof ApplicationSummary

const COLUMNS: Array<{
  key: SortKey
  label: string
  sortable?: boolean
  className?: string
  align?: 'right'
}> = [
  { key: 'applicationNo', label: 'Application', sortable: true },
  { key: 'applicantName', label: 'Applicant', sortable: true },
  { key: 'product', label: 'Product', sortable: true },
  { key: 'loanAmount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'city', label: 'Location', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'riskCategory', label: 'Risk', sortable: true },
  { key: 'creditManager', label: 'Credit Manager', sortable: true },
  { key: 'updatedAt', label: 'Updated', sortable: true, align: 'right' },
]

export default function ApplicationsList() {
  const [params, setParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(params.get('q') ?? '')
  const search = useDebounce(searchInput, 300)

  const page = Number(params.get('page') ?? 1)
  const pageSize = Number(params.get('size') ?? 50)
  const status = (params.get('status') ?? 'All') as ApplicationStatus | 'All'
  const product = params.get('product') ?? 'All'
  const risk = (params.get('risk') ?? 'All') as 'LOW' | 'MEDIUM' | 'HIGH' | 'All'
  const state = params.get('state') ?? 'All'
  const sortBy = (params.get('sortBy') ?? 'updatedAt') as SortKey
  const sortDir = (params.get('sortDir') ?? 'desc') as 'asc' | 'desc'

  /** Writes to the URL so a filtered view is shareable and survives reload. */
  function update(next: Record<string, string | number | undefined>, resetPage = true) {
    const merged = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '' || v === 'All') merged.delete(k)
      else merged.set(k, String(v))
    }
    if (resetPage && !('page' in next)) merged.delete('page')
    setParams(merged, { replace: true })
  }

  // Keep the debounced search in the URL without stamping history entries.
  useEffect(() => {
    const current = params.get('q') ?? ''
    if (current !== search) update({ q: search || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const listParams: ListParams = useMemo(
    () => ({ page, pageSize, search, status, product, risk, state, sortBy, sortDir }),
    [page, pageSize, search, status, product, risk, state, sortBy, sortDir],
  )

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['applications', listParams],
    queryFn: () => api.listApplications(listParams),
    placeholderData: keepPreviousData,
  })

  const { data: facets } = useQuery({ queryKey: ['facets'], queryFn: api.getFacets })
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: api.getStats })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const activeFilters = [status, product, risk, state].filter((v) => v !== 'All').length

  function toggleSort(key: SortKey) {
    if (sortBy === key) update({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' })
    else update({ sortBy: key, sortDir: 'asc' })
  }

  return (
    <div className="space-y-5">
      {/* Header + stats -------------------------------------------------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Loan Applications</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {stats ? (
              <>
                {number(stats.total)} records ·{' '}
                {currencyShort(stats.totalBookValue)} total book value
              </>
            ) : (
              'Loading corpus…'
            )}
          </p>
        </div>

        {stats && (
          <div className="flex flex-wrap gap-2">
            {(['Under Review', 'Approved', 'Disbursed', 'Rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ status: status === s ? 'All' : s })}
                className={cx(
                  'rounded-lg border px-3 py-1.5 text-left transition-colors',
                  status === s
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {s}
                </span>
                <span className="tnum block text-sm font-semibold text-slate-900">
                  {number(stats.byStatus[s] ?? 0)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar --------------------------------------------------------- */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              aria-hidden
            >
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, application no, customer ID, PAN, mobile…"
              className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-9 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                  <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <Select
            label="Status"
            value={status}
            options={['All', ...(facets?.statuses ?? [])]}
            onChange={(v) => update({ status: v })}
          />
          <Select
            label="Product"
            value={product}
            options={['All', ...(facets?.products ?? [])]}
            format={(v) => (v === 'All' ? 'All' : `${v} · ${PRODUCT_LABEL[v] ?? ''}`)}
            onChange={(v) => update({ product: v })}
          />
          <Select
            label="Risk"
            value={risk}
            options={['All', ...(facets?.risks ?? [])]}
            onChange={(v) => update({ risk: v })}
          />
          <Select
            label="State"
            value={state}
            options={['All', ...(facets?.states ?? [])]}
            onChange={(v) => update({ state: v })}
          />

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                update({ status: 'All', product: 'All', risk: 'All', state: 'All' })
              }
            >
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            {isFetching && <Spinner className="h-3.5 w-3.5 text-brand-500" />}
            <span className="tnum">
              {number(from)}–{number(to)} of {number(total)}
            </span>
            {data && (
              <span className="hidden text-slate-400 sm:inline" title="Server query time">
                · {data.tookMs}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table ----------------------------------------------------------- */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cx(
                      'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={cx(
                          'inline-flex items-center gap-1 hover:text-slate-800',
                          sortBy === col.key && 'text-brand-700',
                        )}
                      >
                        {col.label}
                        <SortIcon active={sortBy === col.key} dir={sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending && <SkeletonRows rows={10} cols={COLUMNS.length} />}

              {!isPending &&
                data?.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-slate-100 last:border-0 hover:bg-brand-50/40"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/applications/${row.id}`}
                        className="tnum font-medium text-brand-700 hover:underline"
                      >
                        {row.applicationNo}
                      </Link>
                      <span className="tnum mt-0.5 block text-[11px] text-slate-400">
                        {row.id}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="block font-medium text-slate-900">
                        {row.applicantName}
                      </span>
                      <span className="tnum mt-0.5 block text-[11px] text-slate-400">
                        {row.pan} · {row.mobile}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-700">{row.product}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {PRODUCT_LABEL[row.product]}
                      </span>
                    </td>
                    <td className="tnum px-4 py-2.5 text-right font-medium text-slate-900">
                      {currencyShort(row.loanAmount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-slate-700">{row.city}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {row.state}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <RiskPill risk={row.riskCategory} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{row.creditManager}</td>
                    <td className="tnum px-4 py-2.5 text-right text-slate-500">
                      {date(row.updatedAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {isError && (
          <div className="p-6">
            <EmptyState
              title="Could not load applications"
              description={(error as Error)?.message}
            />
          </div>
        )}

        {!isPending && !isError && data?.rows.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No applications match these filters"
              description="Try clearing the search or widening the filters."
            />
          </div>
        )}

        {/* Pagination ---------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => update({ size: e.target.value })}
              className="h-7 rounded-md border border-slate-300 bg-white px-1.5 text-xs outline-none focus:border-brand-500"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" disabled={page <= 1} onClick={() => update({ page: 1 }, false)}>
              ‹‹
            </Button>
            <Button
              size="sm"
              disabled={page <= 1}
              onClick={() => update({ page: page - 1 }, false)}
            >
              Prev
            </Button>
            <span className="tnum px-2 text-xs text-slate-600">
              Page {number(page)} of {number(totalPages)}
            </span>
            <Button
              size="sm"
              disabled={page >= totalPages}
              onClick={() => update({ page: page + 1 }, false)}
            >
              Next
            </Button>
            <Button
              size="sm"
              disabled={page >= totalPages}
              onClick={() => update({ page: totalPages }, false)}
            >
              ››
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Select({
  label,
  value,
  options,
  onChange,
  format,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  format?: (v: string) => string
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'h-9 rounded-lg border px-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          value === 'All'
            ? 'border-slate-300 bg-white text-slate-600'
            : 'border-brand-300 bg-brand-50 font-medium text-brand-800',
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'All' ? `${label}: All` : (format?.(o) ?? o)}
          </option>
        ))}
      </select>
    </label>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg viewBox="0 0 10 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
      <path
        d="M5 1.5 8 5H2z"
        fill="currentColor"
        className={active && dir === 'asc' ? 'opacity-100' : 'opacity-25'}
      />
      <path
        d="M5 10.5 2 7h6z"
        fill="currentColor"
        className={active && dir === 'desc' ? 'opacity-100' : 'opacity-25'}
      />
    </svg>
  )
}
