/** Display helpers. Everything renders an em dash rather than a blank. */

export const EMPTY = '—'

export function text(v: unknown): string {
  if (v === null || v === undefined) return EMPTY
  if (typeof v === 'string' && v.trim() === '') return EMPTY
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

/** dd/mm/yyyy, matching the LOS screens. */
export function date(iso: unknown): string {
  if (typeof iso !== 'string' || !iso) return EMPTY
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return `${m[3]}/${m[2]}/${m[1]}`
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function currency(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return EMPTY
  return inr.format(v)
}

/** ₹4.25 L / ₹1.20 Cr — the compact form used in summary strips. */
export function currencyShort(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return EMPTY
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)} K`
  return `₹${v}`
}

export function number(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return EMPTY
  return v.toLocaleString('en-IN')
}

export function percent(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return EMPTY
  return `${v}%`
}

/** Joins the non-empty parts of an address into one readable line. */
export function addressLine(parts: Array<string | null | undefined>): string {
  const joined = parts.filter((p) => p && p.trim()).join(', ')
  return joined || EMPTY
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (!parts.length) return '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}
