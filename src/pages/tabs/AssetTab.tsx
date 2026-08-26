import type { Application } from '@/api'
import { DataSection, type FieldDef } from '@/components/DataSection'
import { Pill, cx } from '@/components/primitives'
import { EMPTY, currency, number, text } from '@/lib/format'

const ASSET_FIELDS: FieldDef[] = [
  { key: 'asset', label: 'Asset', span: true, editable: false },
  { key: 'dealerName', label: 'Dealer Name', span: true },

  { key: 'carMake', label: 'Car Make' },
  { key: 'carModel', label: 'Car Model' },
  { key: 'vehicleCategory', label: 'Vehicle Category', type: 'select', options: ['2 Wheelers', '3 Wheelers', '4 Wheelers', 'Commercial'] },
  { key: 'assetCategory', label: 'Asset Category', type: 'select', options: ['A1', 'A2', 'A3', 'A4', 'A5'] },

  { key: 'carRegNo', label: 'Car Reg No', mono: true },
  { key: 'carMfgDate', label: 'Car Mfg. Date', type: 'date', mono: true },
  { key: 'carAgeInMonths', label: 'Car Age (in Months)', type: 'number', mono: true },
  { key: 'rcFcExpiry', label: 'RC / FC Expiry', type: 'date', mono: true },

  { key: 'engineNo', label: 'Engine No', mono: true },
  { key: 'chassisNo', label: 'Chassis No', mono: true },
  { key: 'ownerNoAsPerRc', label: 'Owner No. as mentioned on RC', type: 'number', mono: true },
  { key: 'kilometersRun', label: 'Kilometers Run', type: 'number', mono: true },

  {
    key: 'accidentalVehicle',
    label: 'Accidental Vehicle',
    type: 'select',
    options: ['Yes', 'No'],
    flag: (v) => (v === 'Yes' ? 'Revaluation advised' : null),
  },
  { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] },
  { key: 'color', label: 'Color' },
  { key: 'nameOfTheOwner', label: 'Name of the Owner' },

  { key: 'rcIssuingCity', label: 'RC Issuing City' },
  { key: 'currentHypothecation', label: 'Current Hypothecation' },
  { key: 'currentHypothecationIfOthers', label: 'Current Hypothecation if others' },
  { key: 'btBankName', label: 'BT Bank Name' },

  {
    key: 'vahanDetailsMatchingWithRc',
    label: 'Vahan Details Matching with RC',
    type: 'select',
    options: ['Yes', 'No'],
    flag: (v) => (v === 'No' ? 'RC and Vahan disagree' : null),
    render: (v) => (
      <Pill
        tone={
          v === 'Yes'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-rose-50 text-rose-700 ring-rose-200'
        }
      >
        {String(v)}
      </Pill>
    ),
  },
  { key: 'dealerOwnerContactNumber', label: 'Dealer / Vehicle Owner Contact Number', mono: true },
  { key: 'dealerVehicleOwnerName', label: 'Dealer / Vehicle Owner Name' },
  { key: 'streetName', label: 'Street Name' },

  { key: 'pincode', label: 'Pincode', mono: true },
  { key: 'typeOfVehicle', label: 'Type of Vehicle', type: 'select', options: ['Personal', 'Commercial'] },
  { key: 'carPurchasePrice', label: 'Car Purchase Price', type: 'currency', mono: true },
  { key: 'nocAlreadyIssuedByRto', label: 'NOC already issued by RTO', type: 'select', options: ['Yes', 'No'] },

  {
    key: 'assetDedupeDisposition',
    label: 'Asset Dedupe Disposition',
    type: 'select',
    options: ['Clear', 'Refer'],
    flag: (v) => (v === 'Refer' ? 'Appears on another application' : null),
  },
  { key: 'vahanVehicleExpiryDate', label: 'Vahan Vehicle Expiry Date', type: 'date', mono: true },
  { key: 'vahanInsuranceExpiryDate', label: 'Vahan Insurance Expiry Date', type: 'date', mono: true },
]

const VAHAN_FIELDS: FieldDef[] = [
  { key: 'registrationNumber', label: 'Registration Number', mono: true, editable: false },
  { key: 'chassisNumber', label: 'Chassis Number', mono: true, editable: false },
  { key: 'engineNumber', label: 'Engine Number', mono: true, editable: false },
  { key: 'fitnessValidUpto', label: 'Fitness Valid Upto', type: 'date', mono: true, editable: false },

  { key: 'ownerName', label: 'Owner Name', editable: false },
  { key: 'ownerSrNo', label: 'Owner SR No', type: 'number', mono: true, editable: false },
  { key: 'financierName', label: 'Financier Name', editable: false },
  { key: 'makerModel', label: 'Maker Model', editable: false },

  { key: 'vehicleMakerDescription', label: 'Vehicle Maker Description', editable: false },
  { key: 'bodyTypeDescription', label: 'Body Type Description', editable: false },
  { key: 'vehicleManufacturerDate', label: 'Vehicle Manufacturer Date', mono: true, editable: false },
  { key: 'rcIssuingCity', label: 'RC Issuing City', editable: false },

  { key: 'state', label: 'State', editable: false },
  {
    key: 'blacklistDetails',
    label: 'Blacklist Details',
    editable: false,
    span: true,
    flag: (v) => (v ? 'Vehicle is blacklisted on Vahan' : null),
    render: (v) =>
      v ? (
        <Pill tone="bg-rose-50 text-rose-700 ring-rose-200">{String(v)}</Pill>
      ) : (
        <span className="text-emerald-700">No blacklist record</span>
      ),
  },
]

const VALUATION_FIELDS: FieldDef[] = [
  { key: 'valuation', label: 'Valuation', type: 'currency', mono: true },
  { key: 'valuationStatus', label: 'Valuation Status', type: 'select', options: ['Completed', 'In Progress', 'Not Initiated'] },
  { key: 'valuationAgency', label: 'Valuation Agency' },
  { key: 'valuationDate', label: 'Valuation Date', type: 'date', mono: true },
  { key: 'requestNumber', label: 'Request Number', mono: true, editable: false },
  { key: 'pdfUrl', label: 'Report URL', editable: false },
]

/* ------------------------------------------------------------------ */
/* RC vs Vahan reconciliation                                          */
/* ------------------------------------------------------------------ */

function Reconciliation({ app }: { app: Application }) {
  const rows: Array<[string, string, string]> = [
    ['Registration Number', app.asset.carRegNo, app.vahan.registrationNumber],
    ['Chassis Number', app.asset.chassisNo, app.vahan.chassisNumber],
    ['Engine Number', app.asset.engineNo, app.vahan.engineNumber],
    ['Owner Name', app.asset.nameOfTheOwner, app.vahan.ownerName],
    ['Owner Serial No.', String(app.asset.ownerNoAsPerRc ?? ''), String(app.vahan.ownerSrNo ?? '')],
    ['RC Issuing City', app.asset.rcIssuingCity, app.vahan.rcIssuingCity],
  ]

  const mismatches = rows.filter(([, a, b]) => a && b && a !== b).length

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            RC vs Vahan reconciliation
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            The check credit actually cares about, done for you — instead of
            reading two 15-field blocks and comparing by eye.
          </p>
        </div>
        <Pill
          tone={
            mismatches === 0
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-rose-50 text-rose-700 ring-rose-200'
          }
        >
          {mismatches === 0 ? 'All fields reconcile' : `${mismatches} mismatch${mismatches > 1 ? 'es' : ''}`}
        </Pill>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="w-44 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Field
              </th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Submitted RC
              </th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Vahan API
              </th>
              <th className="w-28 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, a, b]) => {
              const comparable = Boolean(a && b)
              const ok = comparable && a === b
              return (
                <tr key={label} className="border-b border-slate-100 last:border-0">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                    {label}
                  </th>
                  <td className="tnum px-4 py-2 text-slate-800">{text(a)}</td>
                  <td
                    className={cx(
                      'tnum px-4 py-2',
                      !comparable
                        ? 'text-slate-300'
                        : ok
                          ? 'text-slate-800'
                          : 'bg-rose-50/70 font-medium text-rose-900',
                    )}
                  >
                    {text(b)}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {!comparable ? (
                      <span className="text-slate-400">Not comparable</span>
                    ) : ok ? (
                      <span className="font-medium text-emerald-700">Match</span>
                    ) : (
                      <span className="font-medium text-rose-700">Mismatch</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* LTV gauge                                                           */
/* ------------------------------------------------------------------ */

function LtvGauge({ app }: { app: Application }) {
  const val = app.valuation.valuation
  const cap = app.loan.recommendedLtv ?? app.loan.eligibleLtv ?? 0
  const ltv = typeof val === 'number' && val > 0
    ? Math.round((app.loan.loanAmount / val) * 100)
    : null

  const breach = ltv !== null && cap > 0 && ltv > cap

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Loan-to-value against valuation
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Loan {currency(app.loan.loanAmount)} · Valuation{' '}
            {val ? currency(val) : 'not available'} · Purchase price{' '}
            {currency(app.asset.carPurchasePrice)}
          </p>
        </div>
        {ltv !== null && (
          <div className="text-right">
            <span
              className={cx(
                'tnum block text-2xl font-semibold',
                breach ? 'text-rose-600' : 'text-emerald-600',
              )}
            >
              {ltv}%
            </span>
            <span className="text-[11px] text-slate-500">
              cap {cap}% ({app.loan.recommendedLtv ? 'recommended' : 'eligible'})
            </span>
          </div>
        )}
      </div>

      {ltv === null ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Valuation {app.valuation.valuationStatus.toLowerCase()} — LTV cannot be
          computed yet.
        </p>
      ) : (
        <div className="mt-4">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cx(
                'h-full rounded-full transition-all',
                breach ? 'bg-rose-500' : 'bg-emerald-500',
              )}
              style={{ width: `${Math.min(100, ltv)}%` }}
            />
            {cap > 0 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-800"
                style={{ left: `${Math.min(100, cap)}%` }}
                title={`Cap ${cap}%`}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>0%</span>
            <span>100%</span>
          </div>
          {breach && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
              LTV exceeds the {cap}% cap by {ltv - cap} points — needs a deviation
              approval or a lower sanction.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */

export default function AssetTab({ app }: { app: Application }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Reconciliation app={app} />
        <LtvGauge app={app} />
      </div>

      <DataSection
        title="Asset Details"
        subtitle={`${app.asset.carMake} ${app.asset.carModel} · ${app.asset.carRegNo} · ${number(app.asset.kilometersRun)} km`}
        fields={ASSET_FIELDS}
        values={app.asset as unknown as Record<string, unknown>}
        record={app}
        section="asset"
      />

      <DataSection
        title="Vahan Details"
        subtitle="Sourced from the Vahan API — read-only"
        fields={VAHAN_FIELDS}
        values={app.vahan as unknown as Record<string, unknown>}
        record={app}
      />

      <DataSection
        title="Valuation API Details"
        subtitle={
          app.valuation.valuation
            ? `${currency(app.valuation.valuation)} by ${app.valuation.valuationAgency}`
            : EMPTY
        }
        fields={VALUATION_FIELDS}
        values={app.valuation as unknown as Record<string, unknown>}
        record={app}
        cols={3}
      />
    </div>
  )
}
