import { useState } from 'react'
import type { Address, AddressKind, Application } from '@/api'
import { DataSection, type FieldDef, useViewOptions } from '@/components/DataSection'
import { Pill, cx } from '@/components/primitives'
import { EMPTY, addressLine } from '@/lib/format'

const ADDRESS_FIELDS: FieldDef[] = [
  { key: 'addressLine1', label: 'House No. / Building No. / Address Line 1' },
  { key: 'addressLine2', label: 'Street / Building Name / Address Line 2' },
  { key: 'addressLine3', label: 'Landmark / Address Line 3' },
  { key: 'pincode', label: 'Pincode', mono: true },

  { key: 'area', label: 'Area' },
  { key: 'locality', label: 'Locality' },
  { key: 'city', label: 'City' },
  { key: 'landmark', label: 'Landmark' },

  { key: 'state', label: 'State' },
  { key: 'addressType', label: 'Address Type', editable: false },
  { key: 'residenceType', label: 'Residence Type', type: 'select', options: ['Owned', 'Rented', 'Parental', 'Leased', 'Owned RCO'] },
  { key: 'source', label: 'Source', editable: false },

  { key: 'addressModified', label: 'Address Modified', type: 'bool' },
  { key: 'addressProofSubmitted', label: 'Address Proof Submitted', type: 'select', options: ['OVD-Aadhar/ Enrollment', 'Passport', 'Voter ID', 'Utility Bill'] },
  { key: 'documentNumber', label: 'Document Number', mono: true },
  { key: 'documentExpiryDate', label: 'Document Expiry Date', type: 'date', mono: true },

  { key: 'isMailingAddress', label: 'Is Mailing Address', type: 'bool' },
  { key: 'addressEnrichment', label: 'Address Enrichment' },
  { key: 'yearsOfOccupancy', label: 'Years of Occupancy', type: 'number', mono: true },
  { key: 'currentSameAsPermanent', label: 'Current Same as Permanent', type: 'bool' },
]

const CPV_FIELDS: FieldDef[] = [
  { key: 'salesStatus', label: 'Sales Status', type: 'select', options: ['Recommended', 'Not Recommended'] },
  {
    key: 'creditStatus',
    label: 'Credit Status',
    type: 'select',
    options: ['Positive', 'Negative', 'Refer'],
    flag: (v) => (v === 'Negative' ? 'Negative CPV outcome' : null),
  },
  { key: 'geoTaggedVerificationStatus', label: 'Geo Tagged Verification Status', type: 'select', options: ['Verified', 'Mismatch', 'Pending'] },
]

const GEO_FIELDS: FieldDef[] = [
  { key: 'image1GeoLocation', label: 'Image 1 Geo-Location', mono: true, editable: false },
  { key: 'image2GeoLocation', label: 'Image 2 Geo-Location', mono: true, editable: false },
  { key: 'image3GeoLocation', label: 'Image 3 Geo-Location', mono: true, editable: false },
]

const KINDS: Array<{ key: AddressKind; label: string; section: FieldDef['key'] }> = [
  { key: 'current', label: 'Current Residence', section: 'address.current' },
  { key: 'permanent', label: 'Permanent Residence', section: 'address.permanent' },
  { key: 'office', label: 'Office', section: 'address.office' },
  { key: 'gst', label: 'GST', section: 'address.gst' },
]

/* ------------------------------------------------------------------ */
/* Side-by-side comparison                                             */
/* ------------------------------------------------------------------ */

const COMPARE_ROWS: Array<{ label: string; get: (a: Address) => string }> = [
  { label: 'Address', get: (a) => addressLine([a.addressLine1, a.addressLine2, a.addressLine3]) },
  { label: 'City', get: (a) => a.city || EMPTY },
  { label: 'Pincode', get: (a) => a.pincode || EMPTY },
  { label: 'State', get: (a) => a.state || EMPTY },
  { label: 'Residence Type', get: (a) => a.residenceType || EMPTY },
  { label: 'Source', get: (a) => a.source || EMPTY },
  { label: 'Proof', get: (a) => a.addressProofSubmitted || EMPTY },
]

function AddressComparison({ app }: { app: Application }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Address comparison</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            All four addresses side by side — differing values are highlighted so
            mismatches surface without scrolling four separate blocks.
          </p>
        </div>
        {app.addresses.permanent.currentSameAsPermanent ? (
          <Pill tone="bg-emerald-50 text-emerald-700 ring-emerald-200">
            Permanent same as current
          </Pill>
        ) : (
          <Pill tone="bg-amber-50 text-amber-700 ring-amber-200">
            Permanent differs — FI may trigger
          </Pill>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-left">
              <th className="w-40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Field
              </th>
              {KINDS.map((k) => (
                <th
                  key={k.key}
                  className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => {
              const values = KINDS.map((k) => row.get(app.addresses[k.key]))
              const baseline = values[0]
              const anyDiff = values.some((v) => v !== baseline && v !== EMPTY)

              return (
                <tr key={row.label} className="border-b border-slate-100 last:border-0">
                  <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {row.label}
                  </th>
                  {values.map((v, i) => (
                    <td
                      key={i}
                      className={cx(
                        'px-4 py-2 align-top',
                        v === EMPTY
                          ? 'text-slate-300'
                          : anyDiff && i > 0 && v !== baseline
                            ? 'bg-amber-50/70 font-medium text-amber-900'
                            : 'text-slate-800',
                      )}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export default function AddressesTab({ app }: { app: Application }) {
  const { query } = useViewOptions()
  const [active, setActive] = useState<AddressKind>('current')

  return (
    <div className="space-y-4">
      <AddressComparison app={app} />

      {/* Sub-tabs keep four near-identical 20-field blocks from stacking into
          an unreadable wall — the original screens scroll for pages here. */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {KINDS.map((k) => {
          const addr = app.addresses[k.key]
          const filled = ADDRESS_FIELDS.filter((f) => {
            const v = (addr as unknown as Record<string, unknown>)[f.key]
            return v !== '' && v !== null && v !== undefined
          }).length
          return (
            <button
              key={k.key}
              onClick={() => setActive(k.key)}
              className={cx(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active === k.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {k.label}
              <span
                className={cx(
                  'tnum rounded-full px-1.5 py-0.5 text-[10px]',
                  active === k.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500',
                )}
              >
                {filled}/{ADDRESS_FIELDS.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* When a field search is active, show every address block so the match
          can't hide behind an inactive sub-tab. */}
      {(query ? KINDS : KINDS.filter((k) => k.key === active)).map((k) => (
        <DataSection
          key={k.key}
          title={`${k.label} Address`}
          subtitle={addressLine([
            app.addresses[k.key].addressLine1,
            app.addresses[k.key].addressLine2,
            app.addresses[k.key].city,
            app.addresses[k.key].pincode,
          ])}
          fields={ADDRESS_FIELDS}
          values={app.addresses[k.key] as unknown as Record<string, unknown>}
          record={app}
          section={`address.${k.key}` as never}
        />
      ))}

      <DataSection
        title="CPV Elimination"
        fields={CPV_FIELDS}
        values={app.cpvElimination as unknown as Record<string, unknown>}
        record={app}
        section="cpvElimination"
        cols={3}
      />

      <DataSection
        title="Geo Tagging Details"
        fields={GEO_FIELDS}
        values={app.geoTagging as unknown as Record<string, unknown>}
        record={app}
        cols={3}
      />
    </div>
  )
}
