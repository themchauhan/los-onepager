/**
 * One declarative component drives both the read view and the edit form for a
 * section of the record.
 *
 * This is what makes the one-pager denser than the source screens: because
 * every field is declared rather than hand-written JSX, the view options
 * (hide-empty, cross-tab field search, highlight) apply uniformly, and the
 * "Change Data" form is generated from the same list — so the two can never
 * drift apart.
 */

import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import type { Application, EditableSection } from '@/api'
import { EMPTY, currency, date as fmtDate, number as fmtNumber, text } from '@/lib/format'
import { Button, Spinner, cx } from './primitives'

/* ------------------------------------------------------------------ */
/* View options — shared by every section on the page                  */
/* ------------------------------------------------------------------ */

export interface ViewOptions {
  showEmpty: boolean
  query: string
}

const ViewOptionsContext = createContext<ViewOptions>({ showEmpty: true, query: '' })

export const ViewOptionsProvider = ViewOptionsContext.Provider
export const useViewOptions = () => useContext(ViewOptionsContext)

/* ------------------------------------------------------------------ */
/* Field definitions                                                   */
/* ------------------------------------------------------------------ */

export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'bool'
  | 'textarea'

export interface FieldDef {
  key: string
  label: string
  type?: FieldType
  options?: readonly string[]
  /** false marks a system-owned field: shown, never editable. */
  editable?: boolean
  span?: boolean
  mono?: boolean
  hint?: string
  /** Overrides the read-mode rendering (e.g. to add a pill or a warning). */
  render?: (value: unknown, record: Application) => ReactNode
  /** Flags the field as needing attention — draws the amber treatment. */
  flag?: (value: unknown, record: Application) => string | null
}

function displayValue(def: FieldDef, value: unknown): string {
  switch (def.type) {
    case 'currency':
      return currency(value)
    case 'date':
      return fmtDate(value)
    case 'number':
      return fmtNumber(value)
    case 'bool':
      return value === true ? 'Yes' : value === false ? 'No' : EMPTY
    default:
      return text(value)
  }
}

function isEmptyValue(def: FieldDef, value: unknown): boolean {
  if (def.type === 'bool') return false // booleans are always meaningful
  return displayValue(def, value) === EMPTY
}

/** Case-insensitive substring match against the label or the rendered value. */
function matchesQuery(def: FieldDef, value: unknown, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    def.label.toLowerCase().includes(q) ||
    displayValue(def, value).toLowerCase().includes(q)
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

export function DataSection({
  title,
  subtitle,
  fields,
  values,
  record,
  section,
  cols = 4,
  extra,
}: {
  title: string
  subtitle?: string
  fields: FieldDef[]
  values: Record<string, unknown>
  record: Application
  /** Omit to make the section read-only (no Change Data button). */
  section?: EditableSection
  cols?: 2 | 3 | 4
  /** Rendered below the field grid — used for tables and nested blocks. */
  extra?: ReactNode
}) {
  const { showEmpty, query } = useViewOptions()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      api.patchApplication({ id: record.id, section: section!, values: patch }),
    onSuccess: (updated) => {
      qc.setQueryData(['application', record.id], updated)
      qc.invalidateQueries({ queryKey: ['applications'] })
      setEditing(false)
      setDraft({})
    },
  })

  const visible = useMemo(() => {
    return fields.filter((f) => {
      const v = values[f.key]
      if (!matchesQuery(f, v, query)) return false
      if (!showEmpty && isEmptyValue(f, v)) return false
      return true
    })
  }, [fields, values, showEmpty, query])

  const hiddenCount = fields.length - visible.length

  // A section whose fields all filtered out disappears entirely, so a search
  // narrows the page down to just the matching data.
  if (query && visible.length === 0) return null

  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[cols]

  function startEdit() {
    const seed: Record<string, unknown> = {}
    for (const f of fields) {
      if (f.editable !== false) seed[f.key] = values[f.key] ?? ''
    }
    setDraft(seed)
    setEditing(true)
  }

  function save() {
    const changed: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(draft)) {
      const original = values[k] ?? ''
      if (String(v ?? '') !== String(original)) {
        const def = fields.find((f) => f.key === k)
        if (def?.type === 'number' || def?.type === 'currency') {
          changed[k] = v === '' || v === null ? null : Number(v)
        } else if (def?.type === 'bool') {
          changed[k] = Boolean(v)
        } else {
          changed[k] = v
        }
      }
    }
    if (Object.keys(changed).length === 0) {
      setEditing(false)
      return
    }
    mutation.mutate(changed)
  }

  const editableFields = fields.filter((f) => f.editable !== false)

  return (
    <section
      id={`section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      className="scroll-mt-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!editing && hiddenCount > 0 && !query && (
            <span className="text-[11px] text-slate-400">
              {hiddenCount} empty hidden
            </span>
          )}

          {section && !editing && (
            <Button size="sm" variant="secondary" onClick={startEdit}>
              <PencilIcon />
              Change Data
            </Button>
          )}

          {section && editing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false)
                  setDraft({})
                  mutation.reset()
                }}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={save}
                disabled={mutation.isPending}
              >
                {mutation.isPending && <Spinner className="h-3.5 w-3.5" />}
                Save changes
              </Button>
            </>
          )}
        </div>
      </header>

      {mutation.isError && (
        <div className="border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs text-rose-700">
          Could not save: {(mutation.error as Error).message}
        </div>
      )}

      <div className="px-5 py-4">
        {editing ? (
          <div className={cx('grid grid-cols-1 gap-x-6 gap-y-4', colClass)}>
            {editableFields.map((f) => (
              <EditField
                key={f.key}
                def={f}
                value={draft[f.key]}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-2 text-xs text-slate-400">
            All {fields.length} fields in this section are empty.
          </p>
        ) : (
          <dl className={cx('grid grid-cols-1 gap-x-6 gap-y-4', colClass)}>
            {visible.map((f) => (
              <ReadField key={f.key} def={f} value={values[f.key]} record={record} query={query} />
            ))}
          </dl>
        )}

        {extra && <div className={visible.length || editing ? 'mt-5' : ''}>{extra}</div>}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Read / edit field                                                   */
/* ------------------------------------------------------------------ */

function highlight(value: string, query: string): ReactNode {
  if (!query) return value
  const i = value.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return value
  return (
    <>
      {value.slice(0, i)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-slate-900">
        {value.slice(i, i + query.length)}
      </mark>
      {value.slice(i + query.length)}
    </>
  )
}

function ReadField({
  def,
  value,
  record,
  query,
}: {
  def: FieldDef
  value: unknown
  record: Application
  query: string
}) {
  const display = displayValue(def, value)
  const empty = display === EMPTY
  const flag = def.flag?.(value, record) ?? null

  return (
    <div className={cx('min-w-0', def.span && 'sm:col-span-2 lg:col-span-4')}>
      <dt className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {highlight(def.label, query)}
        {def.editable === false && (
          <span title="System field — not editable" className="text-slate-300">
            <LockIcon />
          </span>
        )}
      </dt>
      <dd
        className={cx(
          'break-words text-sm leading-snug',
          def.mono && 'tnum',
          empty ? 'text-slate-300' : 'font-medium text-slate-900',
        )}
      >
        {def.render ? def.render(value, record) : highlight(display, query)}
      </dd>
      {flag && (
        <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
          <WarnIcon />
          {flag}
        </p>
      )}
      {def.hint && !flag && (
        <p className="mt-0.5 text-[11px] text-slate-400">{def.hint}</p>
      )}
    </div>
  )
}

function EditField({
  def,
  value,
  onChange,
}: {
  def: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  const base =
    'h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <label className={cx('block min-w-0', def.span && 'sm:col-span-2 lg:col-span-4')}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {def.label}
      </span>

      {def.type === 'select' ? (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">— Not set —</option>
          {def.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : def.type === 'bool' ? (
        <span className="flex h-9 items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-600">
            {value ? 'Yes' : 'No'}
          </span>
        </span>
      ) : def.type === 'textarea' ? (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      ) : (
        <input
          type={def.type === 'date' ? 'date' : def.type === 'number' || def.type === 'currency' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={cx(base, (def.type === 'number' || def.type === 'currency') && 'tnum')}
        />
      )}

      {def.hint && <span className="mt-1 block text-[11px] text-slate-400">{def.hint}</span>}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M11.2 2.8a1.7 1.7 0 0 1 2.4 2.4L6 12.8l-3.2.8.8-3.2 7.6-7.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
      <rect x="2.5" y="5" width="7" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.2 5V3.8a1.8 1.8 0 1 1 3.6 0V5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
      <path
        d="M6 1.8 11 10.5H1L6 1.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6 5v2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="6" cy="8.8" r="0.6" fill="currentColor" />
    </svg>
  )
}
