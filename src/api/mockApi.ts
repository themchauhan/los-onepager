/**
 * In-browser stand-in for the real LOS backend.
 *
 * It deliberately behaves like a server: the UI never receives more than one
 * page of rows, filtering and sorting happen before pagination, and every call
 * costs a little latency. That way the components are written against the same
 * constraints they'll face in production, and swapping in `httpApi` changes
 * nothing above this file.
 */

import {
  TOTAL_RECORDS,
  indexForId,
  makeDetail,
  makeSummary,
} from '@/mock/generator'
import { PRODUCTS, RISKS, STATUSES, CITIES } from '@/mock/reference'
import type {
  ApiClient,
  Application,
  ApplicationSummary,
  FacetOptions,
  ListParams,
  Page,
  PatchRequest,
} from './types'

/* ------------------------------------------------------------------ */
/* Index                                                               */
/* ------------------------------------------------------------------ */

let index: ApplicationSummary[] | null = null
/** Lower-cased haystack per row, built once, so search stays a fast scan. */
let haystack: string[] | null = null

function ensureIndex(): { rows: ApplicationSummary[]; hay: string[] } {
  if (index && haystack) return { rows: index, hay: haystack }

  const t0 = performance.now()
  const rows = new Array<ApplicationSummary>(TOTAL_RECORDS)
  const hay = new Array<string>(TOTAL_RECORDS)

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const row = applyOverridesToSummary(makeSummary(i))
    rows[i] = row
    hay[i] =
      `${row.applicantName} ${row.applicationNo} ${row.customerId} ${row.pan} ${row.mobile} ${row.city}`.toLowerCase()
  }

  index = rows
  haystack = hay
  // eslint-disable-next-line no-console
  console.info(
    `[mockApi] indexed ${TOTAL_RECORDS.toLocaleString()} records in ${Math.round(performance.now() - t0)}ms`,
  )
  return { rows, hay }
}

/** Called after an edit so the list reflects the new values. */
function invalidateIndexRow(id: string) {
  const i = indexForId(id)
  if (i < 0 || !index || !haystack) return
  const row = applyOverridesToSummary(makeSummary(i))
  index[i] = row
  haystack[i] =
    `${row.applicantName} ${row.applicationNo} ${row.customerId} ${row.pan} ${row.mobile} ${row.city}`.toLowerCase()
}

/* ------------------------------------------------------------------ */
/* Edit overrides                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'los-onepager.overrides.v1'

type Overrides = Record<string, Record<string, Record<string, unknown>>>

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Overrides) : {}
  } catch {
    // Private mode, blocked storage, corrupt JSON — edits just won't persist.
    return {}
  }
}

let overrides: Overrides = loadOverrides()

function saveOverrides() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    /* non-fatal */
  }
}

export function resetOverrides() {
  overrides = {}
  saveOverrides()
  index = null
  haystack = null
}

export function overrideCount(): number {
  return Object.keys(overrides).length
}

/** Summary fields are projections of edited sections; keep them in sync. */
function applyOverridesToSummary(row: ApplicationSummary): ApplicationSummary {
  const o = overrides[row.id]
  if (!o) return row

  const next = { ...row }
  const demo = o['demographics']
  if (demo) {
    const first = (demo.firstName as string) ?? undefined
    const middle = (demo.middleName as string) ?? undefined
    const last = (demo.lastNameEntityName as string) ?? undefined
    if (first || middle || last) {
      const [f, m, l] = row.applicantName.split(' ')
      next.applicantName = [first ?? f, middle ?? m, last ?? l]
        .filter(Boolean)
        .join(' ')
    }
    if (demo.pan) next.pan = demo.pan as string
    if (demo.customerId) next.customerId = demo.customerId as string
  }
  const contact = o['contact']
  if (contact?.mobileNumber) next.mobile = contact.mobileNumber as string

  const loan = o['loan']
  if (loan?.loanAmount != null) next.loanAmount = Number(loan.loanAmount)
  if (loan?.riskCategory) {
    next.riskCategory = loan.riskCategory as ApplicationSummary['riskCategory']
  }
  if (loan?.creditManager) next.creditManager = loan.creditManager as string

  const addr = o['address.current']
  if (addr?.city) next.city = addr.city as string
  if (addr?.state) next.state = addr.state as string

  if (Object.keys(o).length) next.updatedAt = new Date().toISOString().slice(0, 10)
  return next
}

/** Deep-merges the stored patches into a freshly generated detail record. */
function applyOverridesToDetail(app: Application): Application {
  const o = overrides[app.id]
  if (!o) return app

  const next: Application = structuredClone(app)

  for (const [section, values] of Object.entries(o)) {
    if (section.startsWith('address.')) {
      const kind = section.split('.')[1] as keyof Application['addresses']
      next.addresses[kind] = { ...next.addresses[kind], ...values } as never
    } else {
      const key = section as keyof Application
      const target = next[key]
      if (target && typeof target === 'object') {
        Object.assign(target as object, values)
      }
    }
  }

  // Keep the summary-level projections consistent inside the detail record too.
  const merged = applyOverridesToSummary(next)
  return { ...next, ...merged }
}

/* ------------------------------------------------------------------ */
/* Query                                                               */
/* ------------------------------------------------------------------ */

function latency(min = 90, max = 260): Promise<void> {
  const ms = min + Math.random() * (max - min)
  return new Promise((r) => setTimeout(r, ms))
}

function compare(
  a: ApplicationSummary,
  b: ApplicationSummary,
  key: keyof ApplicationSummary,
): number {
  const x = a[key]
  const y = b[key]
  if (typeof x === 'number' && typeof y === 'number') return x - y
  return String(x).localeCompare(String(y))
}

export const mockApi: ApiClient = {
  async listApplications(params: ListParams): Promise<Page<ApplicationSummary>> {
    await latency()
    const t0 = performance.now()
    const { rows, hay } = ensureIndex()

    const q = params.search?.trim().toLowerCase() ?? ''
    const matched: ApplicationSummary[] = []

    for (let i = 0; i < rows.length; i++) {
      if (q && !hay[i].includes(q)) continue
      const r = rows[i]
      if (params.status && params.status !== 'All' && r.status !== params.status) continue
      if (params.product && params.product !== 'All' && r.product !== params.product) continue
      if (params.risk && params.risk !== 'All' && r.riskCategory !== params.risk) continue
      if (params.state && params.state !== 'All' && r.state !== params.state) continue
      matched.push(r)
    }

    const sortBy = params.sortBy ?? 'updatedAt'
    const dir = params.sortDir === 'asc' ? 1 : -1
    matched.sort((a, b) => compare(a, b, sortBy) * dir)

    const start = (params.page - 1) * params.pageSize
    return {
      rows: matched.slice(start, start + params.pageSize),
      total: matched.length,
      page: params.page,
      pageSize: params.pageSize,
      tookMs: Math.round(performance.now() - t0),
    }
  },

  async getApplication(id: string): Promise<Application> {
    await latency(60, 180)
    const i = indexForId(id)
    if (i < 0) throw new Error(`Application ${id} not found`)
    return applyOverridesToDetail(makeDetail(i))
  },

  async patchApplication(req: PatchRequest): Promise<Application> {
    await latency(140, 340)
    const i = indexForId(req.id)
    if (i < 0) throw new Error(`Application ${req.id} not found`)

    const forId = (overrides[req.id] ??= {})
    forId[req.section] = { ...(forId[req.section] ?? {}), ...req.values }
    saveOverrides()
    invalidateIndexRow(req.id)

    return applyOverridesToDetail(makeDetail(i))
  },

  async getFacets(): Promise<FacetOptions> {
    await latency(30, 80)
    return {
      statuses: [...STATUSES],
      products: [...PRODUCTS],
      risks: [...RISKS],
      states: [...new Set(CITIES.map((c) => c.state))].sort(),
    }
  },

  async getStats() {
    await latency(60, 140)
    const { rows } = ensureIndex()
    const byStatus: Record<string, number> = {}
    const byRisk: Record<string, number> = {}
    let totalBookValue = 0

    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
      byRisk[r.riskCategory] = (byRisk[r.riskCategory] ?? 0) + 1
      totalBookValue += r.loanAmount
    }
    return { total: rows.length, byStatus, byRisk, totalBookValue }
  },
}
