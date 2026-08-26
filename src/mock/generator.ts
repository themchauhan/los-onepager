/**
 * Deterministic record generator.
 *
 * Every field is derived from a seed computed from the record's index, so
 * `makeSummary(i)` and `makeDetail(i)` always agree and no data needs to be
 * stored on disk. That keeps the repo small while still giving the UI a
 * 50,000-row corpus to page through.
 */

import type {
  Address,
  Application,
  ApplicationStatus,
  ApplicationSummary,
  DedupeMatchRow,
  MatchParameter,
  StageStatus,
  WorkflowStage,
} from '@/api/types'
import {
  BANKS,
  BRANCHES,
  BUSINESS_SUFFIX,
  CITIES,
  COLORS,
  CREDIT_MANAGERS,
  DEALERS,
  FIRST_NAMES_F,
  FIRST_NAMES_M,
  LANDMARKS,
  LOCALITY_PREFIX,
  PRODUCTS,
  RISKS,
  SOURCING_CHANNELS,
  STATUSES,
  SURNAMES,
  VEHICLES,
  WORKFLOW_STAGES,
} from './reference'

export const TOTAL_RECORDS = 50_000
const ID_BASE = 100_000

/* ------------------------------------------------------------------ */
/* Seeded pseudo-random                                                */
/* ------------------------------------------------------------------ */

/** mulberry32 — small, fast, good enough distribution for fixtures. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Rng {
  private next: () => number
  constructor(seed: number) {
    this.next = mulberry32(seed)
  }
  float(): number {
    return this.next()
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
  bool(trueProbability = 0.5): boolean {
    return this.next() < trueProbability
  }
  /** Picks by weight — `weights` must be the same length as `arr`. */
  weighted<T>(arr: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = this.next() * total
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i]
      if (r <= 0) return arr[i]
    }
    return arr[arr.length - 1]
  }
  digits(n: number): string {
    let s = ''
    for (let i = 0; i < n; i++) s += this.int(0, 9)
    return s
  }
  letters(n: number): string {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let s = ''
    for (let i = 0; i < n; i++) s += A[this.int(0, 25)]
    return s
  }
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`
}

/** dd/mm/yyyy — how the LOS screens render dates. */
export function toDisplayDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function ageFromDob(iso: string, asOf = new Date('2026-08-26')): string {
  const dob = new Date(iso)
  let years = asOf.getFullYear() - dob.getFullYear()
  let months = asOf.getMonth() - dob.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  return `${years} years ${months} month(s)`
}

function panFor(rng: Rng, surname: string): string {
  return `${rng.letters(3)}P${surname[0].toUpperCase()}${rng.digits(4)}${rng.letters(1)}`
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export function idForIndex(index: number): string {
  return `APP-${ID_BASE + index}`
}

export function indexForId(id: string): number {
  const n = Number(id.replace('APP-', ''))
  if (!Number.isFinite(n)) return -1
  const idx = n - ID_BASE
  return idx >= 0 && idx < TOTAL_RECORDS ? idx : -1
}

interface Core {
  rng: Rng
  gender: 'Male' | 'Female'
  first: string
  middle: string
  last: string
  fullName: string
  cityRef: (typeof CITIES)[number]
  pincode: string
  product: string
  status: ApplicationStatus
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  loanAmount: number
  customerId: string
  pan: string
  mobile: string
  createdAt: string
  updatedAt: string
  applicationNo: string
  creditManager: string
}

/** The fields shared by the summary and the detail view. */
function core(index: number): Core {
  const rng = new Rng(index * 2654435761 + 12345)

  const gender = rng.bool(0.42) ? 'Female' : 'Male'
  const first = gender === 'Female' ? rng.pick(FIRST_NAMES_F) : rng.pick(FIRST_NAMES_M)
  const middle = gender === 'Female' ? rng.pick(FIRST_NAMES_M) : rng.pick(FIRST_NAMES_M)
  const last = rng.pick(SURNAMES)
  const fullName = `${first} ${middle} ${last}`.toUpperCase()

  const cityRef = rng.pick(CITIES)
  const pincode = rng.pick(cityRef.pincodes)

  const product = rng.weighted(PRODUCTS, [40, 25, 12, 13, 10])
  const status = rng.weighted(
    STATUSES as unknown as ApplicationStatus[],
    [6, 18, 24, 20, 8, 19, 5],
  )
  const risk = rng.weighted(RISKS as unknown as Array<'LOW' | 'MEDIUM' | 'HIGH'>, [58, 30, 12])

  const loanAmount = rng.int(15, 240) * 10_000

  const createdMonth = rng.int(1, 8)
  const createdDay = rng.int(1, 28)
  const createdAt = isoDate(2026, createdMonth, createdDay)
  const updatedAt = isoDate(2026, Math.min(8, createdMonth + rng.int(0, 1)), rng.int(1, 28))

  return {
    rng,
    gender,
    first,
    middle,
    last,
    fullName,
    cityRef,
    pincode,
    product,
    status,
    risk,
    loanAmount,
    customerId: String(600_000_000 + index * 631 + rng.int(0, 600)),
    pan: panFor(rng, last),
    mobile: `${rng.pick([6, 7, 8, 9])}${rng.digits(9)}`,
    createdAt,
    updatedAt,
    applicationNo: `${last.slice(0, 4).toUpperCase()}-${product}-${pad(createdDay)}${pad(createdMonth)}${String(2026).slice(2)}-${rng.digits(4)}`,
    creditManager: rng.pick(CREDIT_MANAGERS),
  }
}

export function makeSummary(index: number): ApplicationSummary {
  const c = core(index)
  return {
    id: idForIndex(index),
    applicationNo: c.applicationNo,
    applicantName: c.fullName,
    customerId: c.customerId,
    pan: c.pan,
    mobile: c.mobile,
    product: c.product,
    loanAmount: c.loanAmount,
    city: c.cityRef.city,
    state: c.cityRef.state,
    status: c.status,
    riskCategory: c.risk,
    creditManager: c.creditManager,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

function makeAddress(
  rng: Rng,
  kind: 'current' | 'permanent' | 'office' | 'gst',
  c: Core,
  sameAsCurrent: boolean,
  base?: Address,
): Address {
  if (sameAsCurrent && base) {
    return {
      ...base,
      addressType: kind === 'permanent' ? 'Permanent Residence' : base.addressType,
      isMailingAddress: false,
      currentSameAsPermanent: true,
      yearsOfOccupancy: base.yearsOfOccupancy,
    }
  }

  const plot = `PLOT NO ${rng.int(1, 900)}${rng.bool(0.4) ? ` ${rng.letters(1)} ${rng.letters(1)} ${rng.int(1, 40)}` : ''}`
  const locality = rng.pick(LOCALITY_PREFIX)
  const pincode = kind === 'gst' ? rng.pick(c.cityRef.pincodes) : c.pincode

  return {
    addressLine1:
      kind === 'office'
        ? `${c.last.toUpperCase()} ${rng.pick(BUSINESS_SUFFIX)}`
        : plot,
    addressLine2:
      kind === 'office'
        ? `${plot} ${locality}`
        : `${locality} ${rng.pick(LOCALITY_PREFIX)}`,
    addressLine3: `${rng.pick(LOCALITY_PREFIX)} ${c.cityRef.city}`,
    pincode,
    area: '',
    locality: `${c.cityRef.city}-${pincode}`,
    city: c.cityRef.city,
    landmark: kind === 'current' ? rng.pick(LANDMARKS) : '',
    state: c.cityRef.state,
    district: c.cityRef.city,
    addressType:
      kind === 'current'
        ? 'Current Residence'
        : kind === 'permanent'
          ? 'Permanent Residence'
          : kind === 'office'
            ? 'Office'
            : 'GST',
    residenceType:
      kind === 'office' ? rng.pick(['Owned RCO', 'Rented', 'Leased']) : rng.pick(['Owned', 'Rented', 'Parental']),
    source: kind === 'gst' ? 'GST' : 'Manual',
    addressModified: rng.bool(0.7),
    addressProofSubmitted: kind === 'gst' ? '' : 'OVD-Aadhar/ Enrollment',
    documentNumber: kind === 'gst' ? '' : rng.digits(4),
    documentExpiryDate: '',
    isMailingAddress: kind === 'current',
    addressEnrichment: '',
    yearsOfOccupancy: kind === 'current' ? rng.int(1, 25) : null,
    currentSameAsPermanent: false,
  }
}

function makeWorkflow(rng: Rng, status: ApplicationStatus): WorkflowStage[] {
  const terminal = status === 'Approved' || status === 'Disbursed'
  const cursor = terminal ? WORKFLOW_STAGES.length : rng.int(4, WORKFLOW_STAGES.length)

  return WORKFLOW_STAGES.map((stage, i) => {
    let s: StageStatus
    if (i < cursor) s = 'complete'
    else if (i === cursor) s = 'in-progress'
    else s = 'pending'
    // Banking is the section most often kicked back in the source screens.
    if (stage.key === 'banking' && rng.bool(0.25)) s = 'flagged'
    return { key: stage.key, label: stage.label, status: s }
  })
}

function makeDedupeMatches(
  rng: Rng,
  c: Core,
  dob: string,
  /** The exact string the source record shows, so a claimed match is literal. */
  sourcePermanent: string,
): DedupeMatchRow[] {
  const count = rng.weighted([0, 1, 2, 3], [22, 48, 22, 8])
  const rows: DedupeMatchRow[] = []

  for (let i = 0; i < count; i++) {
    // The first match is usually the same person; later ones are near-misses.
    const strong = i === 0 && rng.bool(0.8)
    const matched: MatchParameter[] = strong
      ? ['name', 'dob', 'pan', 'mobile']
      : rng.pick([
          ['name', 'address'],
          ['mobile'],
          ['name', 'dob'],
          ['pan'],
        ] as MatchParameter[][])

    // A field claimed as "matched" must actually hold the source value —
    // otherwise the comparison table shows "Match" next to two different
    // values, which is worse than showing nothing.
    rows.push({
      customerId: strong ? c.customerId : String(600_000_000 + rng.int(0, 9_999_999)),
      customerName: matched.includes('name')
        ? c.fullName
        : `${rng.pick(FIRST_NAMES_M)} ${rng.pick(SURNAMES)}`.toUpperCase(),
      dob: matched.includes('dob')
        ? dob
        : isoDate(rng.int(1968, 1998), rng.int(1, 12), rng.int(1, 28)),
      mobile: matched.includes('mobile') ? c.mobile : `${rng.pick([7, 8, 9])}${rng.digits(9)}`,
      pan: matched.includes('pan') ? c.pan : panFor(rng, rng.pick(SURNAMES)),
      currentResidenceAddress: `PLOT NO ${rng.int(1, 99)} ${rng.pick(LOCALITY_PREFIX)} ROAD, ${c.cityRef.city} - ${c.pincode}`,
      permanentAddress: matched.includes('address')
        ? sourcePermanent
        : `PLOT NO ${rng.int(1, 99)} ${rng.pick(LOCALITY_PREFIX)}, ${c.cityRef.city} - ${rng.pick(c.cityRef.pincodes)}`,
      bankAccountNo: rng.digits(12),
      aadhaar: rng.digits(4),
      ovdDetails: rng.pick(['Aadhaar', 'Voter ID', 'Passport', 'Driving License']),
      loanDetailsRef: `LN-${rng.digits(8)}`,
      isMfi: rng.bool(0.08) ? 'Yes' : 'No',
      isParallel: rng.bool(0.12) ? 'Yes' : 'No',
      matchedFields: matched,
    })
  }
  return rows
}

export function makeDetail(index: number): Application {
  const c = core(index)
  // A second stream so detail fields don't disturb the summary sequence.
  const rng = new Rng(index * 40503 + 7919)

  const dobYear = rng.int(1966, 2000)
  const dob = isoDate(dobYear, rng.int(1, 12), rng.int(1, 28))
  const vehicle = rng.pick(VEHICLES)
  const model = rng.pick(vehicle.models)
  const mfgYear = rng.int(2019, 2025)
  const purchasePrice = rng.int(vehicle.priceBand[0], vehicle.priceBand[1])
  const isHighTicket = c.loanAmount >= 1_500_000

  // The vehicle's identity is generated once, then both the "submitted RC" and
  // the "Vahan API" blocks are derived from it. They agree unless the record is
  // explicitly flagged as not matching — otherwise the reconciliation panel
  // would report mismatches on every single application.
  const rcRegNo = `${c.cityRef.rtoCode}${rng.letters(2)}${rng.digits(4)}`
  const rcChassis = `${rng.letters(5)}${rng.digits(11)}`
  const rcEngine = `${rng.letters(1)}${rng.digits(1)}${rng.letters(2)}${rng.digits(3)}${rng.letters(1)}${rng.digits(6)}`
  const rcOwnerName = `${rng.pick(FIRST_NAMES_M)} ${rng.pick(SURNAMES)}`.toUpperCase()
  const rcOwnerSrNo = rng.weighted([1, 2, 3], [70, 24, 6])

  const vahanMatches = rng.bool(0.88)
  // When it doesn't match, corrupt one or two specific fields — that's what a
  // real discrepancy looks like, not a wholesale difference.
  const corrupt = vahanMatches
    ? new Set<string>()
    : new Set(rng.pick([['chassis'], ['engine'], ['owner'], ['chassis', 'owner'], ['reg']]))

  const currentAddr = makeAddress(rng, 'current', c, false)
  const permSame = rng.bool(0.62)
  const permanentAddr = makeAddress(rng, 'permanent', c, permSame, currentAddr)
  const officeAddr = makeAddress(rng, 'office', c, false)
  const gstAddr = makeAddress(rng, 'gst', c, false)

  const tenor = rng.pick([36, 48, 60, 72, 84])
  const roi = Number((rng.int(1050, 1780) / 100).toFixed(2))
  const monthlyRate = roi / 12 / 100
  const emi = Math.round(
    (c.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenor)) /
      (Math.pow(1 + monthlyRate, tenor) - 1),
  )

  const summary = makeSummary(index)

  const currentAddressStr = `${currentAddr.addressLine1} ${currentAddr.addressLine2}, ${currentAddr.city} ${currentAddr.state} - ${currentAddr.pincode}`
  const permanentAddressStr = `${permanentAddr.addressLine1} ${permanentAddr.addressLine2}, ${permanentAddr.city} ${permanentAddr.state} - ${permanentAddr.pincode}`

  return {
    ...summary,

    demographics: {
      prefixSalutation: c.gender === 'Female' ? (rng.bool(0.7) ? 'Mrs.' : 'Ms.') : 'Mr.',
      firstName: c.first.toUpperCase(),
      middleName: c.middle.toUpperCase(),
      lastNameEntityName: c.last.toUpperCase(),
      dateOfBirthIncorporation: dob,
      ageInYearAndMonth: ageFromDob(dob),
      nameAsPerPan: c.fullName,
      dobDoiAsPerPan: dob,
      gender: c.gender,
      bflCustomerType: rng.pick(['', 'Existing', 'New to BFL']),
      customerType: 'Individual',
      applicantType: rng.weighted(
        ['Primary', 'Co-Applicant', 'Guarantor'] as const,
        [78, 17, 5],
      ),
      customerId: c.customerId,
      pan: c.pan,
      applicantConstitution: 'Individual',
      isBeneficialOwner: rng.bool(0.15),
      beneficialOwnerSharePct: rng.bool(0.15) ? rng.int(10, 100) : null,
      profile: rng.pick(['Non Agri Profile', 'Agri Profile']),
      profileClassification: rng.weighted(
        ['Normal Profile', 'Sensitive Profile', 'Negative Profile'],
        [82, 14, 4],
      ),
      applicantModified: rng.bool(0.2),
      relationshipType: rng.pick(['Self', 'Spouse', 'Father', 'Son']),
      productName: c.product,
      maritalStatus: rng.weighted(['Married', 'Single', 'Widowed'], [68, 28, 4]),
      cinNumber: '',
      ovdRegistrationType: rng.pick(['', 'Aadhaar', 'Passport', 'Voter ID']),
      vintageAtBusinessPlace: rng.int(1, 22),
      ekycConsentStatus: rng.weighted(['Approved', 'Pending', 'Declined'], [80, 15, 5]),
      cibilAddressCheck: rng.weighted(
        ['MATCH', 'NO MATCH', 'NOT INITIATED'] as const,
        [68, 22, 10],
      ),
      cibilUidaiCheck: rng.pick(['', 'MATCH', 'NO MATCH']),
      msmeClassification: rng.bool(0.3) ? 'Yes' : 'No',
      msmeType: rng.bool(0.3) ? rng.pick(['Micro', 'Small', 'Medium']) : '',
      nicCode: rng.bool(0.3) ? rng.digits(5) : '',
      udhyamRegistrationNo: rng.bool(0.22) ? `UDYAM-MH-${rng.digits(2)}-${rng.digits(7)}` : '',
      dinNumber: '',
      kycPodStatus: rng.pick(['Search Initiated', 'Completed', 'Pending']),
      leiNumber: isHighTicket && rng.bool(0.6) ? `${rng.digits(4)}00${rng.letters(2)}${rng.digits(10)}` : '',
      leiRegistrationStatus: isHighTicket ? rng.pick(['ISSUED', 'LAPSED', 'PENDING']) : '',
      leiExpiryDate: isHighTicket ? isoDate(rng.int(2026, 2029), rng.int(1, 12), rng.int(1, 28)) : '',
    },

    contact: {
      mobileNumber: c.mobile,
      alternateMobileNumber: rng.bool(0.35) ? `${rng.pick([7, 8, 9])}${rng.digits(9)}` : '',
      emailId: rng.bool(0.55)
        ? `${c.first.toLowerCase()}.${c.last.toLowerCase()}${rng.int(1, 99)}@gmail.com`
        : '',
      mobileStatus: rng.weighted(['Not Initiated', 'Verified', 'Failed'], [45, 48, 7]),
      mobileResponse: '',
    },

    addresses: {
      current: currentAddr,
      permanent: permanentAddr,
      office: officeAddr,
      gst: gstAddr,
    },

    cpvElimination: {
      salesStatus: rng.pick(['', 'Recommended', 'Not Recommended']),
      creditStatus: rng.pick(['', 'Positive', 'Negative', 'Refer']),
      geoTaggedVerificationStatus: rng.pick(['', 'Verified', 'Mismatch', 'Pending']),
    },

    geoTagging: {
      image1GeoLocation: rng.bool(0.5)
        ? `${(rng.int(1800, 2800) / 100).toFixed(4)}, ${(rng.int(7200, 8800) / 100).toFixed(4)}`
        : '',
      image2GeoLocation: '',
      image3GeoLocation: '',
    },

    dedupe: {
      currentCustomer: {
        customerId: c.customerId,
        customerName: c.fullName,
        dob,
        mobile: c.mobile,
        pan: c.pan,
        currentResidenceAddress: currentAddressStr,
        permanentAddress: permanentAddressStr,
        bankAccountNo: rng.digits(12),
        aadhaar: rng.digits(4),
        ovdDetails: rng.pick(['Aadhaar', 'Voter ID', 'Passport']),
      },
      matches: makeDedupeMatches(rng, c, dob, permanentAddressStr),
      matchingParameters: ['name', 'dob', 'pan', 'mobile', 'address'],
      bflExposure: Array.from({ length: rng.weighted([0, 1, 2, 3], [35, 35, 20, 10]) }, () => {
        const sanctioned = rng.int(8, 90) * 10_000
        return {
          loanAccountNo: `${rng.digits(3)}CD${rng.digits(8)}`,
          product: rng.pick(PRODUCTS),
          sanctionedAmount: sanctioned,
          outstanding: Math.round(sanctioned * (rng.int(5, 92) / 100)),
          emi: Math.round(sanctioned / rng.int(24, 60)),
          status: rng.weighted(['Active', 'Closed', 'Overdue'], [62, 30, 8]),
          disbursalDate: isoDate(rng.int(2021, 2025), rng.int(1, 12), rng.int(1, 28)),
        }
      }),
      familyDedupe: Array.from({ length: rng.weighted([0, 1, 2], [50, 34, 16]) }, () => ({
        customerId: String(600_000_000 + rng.int(0, 9_999_999)),
        customerName: `${rng.pick([...FIRST_NAMES_M, ...FIRST_NAMES_F])} ${c.last}`.toUpperCase(),
        relationship: rng.pick(['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother']),
        mobile: `${rng.pick([7, 8, 9])}${rng.digits(9)}`,
        pan: panFor(rng, c.last),
        activeLoans: rng.int(0, 3),
        totalOutstanding: rng.int(0, 60) * 10_000,
        worstDpd: rng.weighted([0, 15, 30, 60, 90], [58, 18, 12, 8, 4]),
      })),
      bflTrackRecords: Array.from({ length: rng.weighted([0, 1, 2], [40, 40, 20]) }, () => {
        const paid = rng.int(6, 58)
        return {
          loanAccountNo: `${rng.digits(3)}CD${rng.digits(8)}`,
          product: rng.pick(PRODUCTS),
          emisPaid: paid,
          emisBounced: rng.weighted([0, 1, 2, 4], [62, 22, 11, 5]),
          currentDpd: rng.weighted([0, 7, 21, 45], [76, 13, 7, 4]),
          maxDpd: rng.weighted([0, 15, 30, 90], [55, 22, 15, 8]),
          closureType: rng.pick(['', 'Normal Closure', 'Foreclosure', 'Running']),
        }
      }),
    },

    asset: {
      asset: `${vehicle.make} ${model.split(' ')[0]}(${mfgYear - 1}-${mfgYear}) ${model}`,
      dealerName: rng.pick(DEALERS),
      carMake: vehicle.make,
      carModel: `${model.split(' ')[0]}(${mfgYear - 1}-${mfgYear})`,
      vehicleCategory: '4 Wheelers',
      assetCategory: vehicle.category,
      carRegNo: rcRegNo,
      carMfgDate: isoDate(mfgYear, rng.int(1, 12), 1),
      carAgeInMonths: (2026 - mfgYear) * 12 + rng.int(0, 11),
      rcFcExpiry: isoDate(mfgYear + 15, rng.int(1, 12), rng.int(1, 28)),
      engineNo: rcEngine,
      chassisNo: rcChassis,
      ownerNoAsPerRc: rcOwnerSrNo,
      kilometersRun: rng.int(2_000, 96_000),
      accidentalVehicle: rng.bool(0.08) ? 'Yes' : '',
      fuelType: rng.weighted(['Petrol', 'Diesel', 'CNG', 'Electric'], [58, 28, 11, 3]),
      color: rng.pick(COLORS),
      nameOfTheOwner: rcOwnerName,
      rcIssuingCity: c.cityRef.city,
      currentHypothecation: rng.bool(0.35) ? rng.pick(BANKS) : '',
      currentHypothecationIfOthers: '',
      btBankName: rng.bool(0.18) ? rng.pick(BANKS) : '',
      vahanDetailsMatchingWithRc: vahanMatches ? 'Yes' : 'No',
      dealerOwnerContactNumber: `${rng.pick([7, 8, 9])}${rng.digits(9)}`,
      dealerVehicleOwnerName: `${rng.pick(FIRST_NAMES_M)} ${rng.pick(SURNAMES)}`.toUpperCase(),
      streetName: c.cityRef.city,
      pincode: rng.pick(c.cityRef.pincodes),
      typeOfVehicle: rng.weighted(['Personal', 'Commercial'], [86, 14]),
      carPurchasePrice: purchasePrice,
      nocAlreadyIssuedByRto: rng.bool(0.2) ? 'Yes' : 'No',
      assetDedupeDisposition: rng.pick(['', 'Clear', 'Refer']),
      vahanVehicleExpiryDate: isoDate(mfgYear + 15, rng.int(1, 12), rng.int(1, 28)),
      vahanInsuranceExpiryDate: isoDate(rng.int(2026, 2029), rng.int(1, 12), rng.int(1, 28)),
    },

    vahan: {
      registrationNumber: corrupt.has('reg')
        ? `${c.cityRef.rtoCode}${rng.letters(2)}${rng.digits(4)}`
        : rcRegNo,
      chassisNumber: corrupt.has('chassis')
        ? `${rng.letters(5)}${rng.digits(11)}`
        : rcChassis,
      fitnessValidUpto: isoDate(mfgYear + 15, rng.int(1, 12), rng.int(1, 28)),
      financierName: rng.bool(0.3) ? rng.pick(BANKS) : 'NA',
      engineNumber: corrupt.has('engine')
        ? `${rng.letters(1)}${rng.digits(1)}${rng.letters(2)}${rng.digits(3)}${rng.letters(1)}${rng.digits(6)}`
        : rcEngine,
      ownerSrNo: rcOwnerSrNo,
      ownerName: corrupt.has('owner')
        ? `${rng.pick(FIRST_NAMES_M)} ${rng.pick(SURNAMES)}`.toUpperCase()
        : rcOwnerName,
      makerModel: `${vehicle.make} ${model}`.toUpperCase(),
      rcIssuingCity: c.cityRef.city,
      vehicleMakerDescription: `${vehicle.make} INDIA PVT LTD`,
      bodyTypeDescription: vehicle.body,
      state: c.cityRef.state,
      vehicleManufacturerDate: `${pad(rng.int(1, 12))}/${mfgYear}`,
      blacklistDetails: rng.bool(0.04) ? 'BLACKLISTED - RTO NOTICE' : '',
    },

    valuation: {
      valuation: rng.bool(0.7) ? Math.round(purchasePrice * (rng.int(72, 98) / 100)) : null,
      valuationStatus: rng.weighted(['Completed', 'In Progress', 'Not Initiated'], [62, 24, 14]),
      requestNumber: `VAL${rng.digits(9)}`,
      pdfUrl: '',
      valuationAgency: rng.pick(['AUTOINSPEKT', 'CARWALE VALUATION', 'IMT VALUERS']),
      valuationDate: isoDate(2026, rng.int(1, 8), rng.int(1, 28)),
    },

    loan: {
      loanAmount: c.loanAmount,
      requestedLoanAmount: Math.round(c.loanAmount * (rng.int(95, 118) / 100)),
      requestedLoanTenorMonths: tenor,
      approvedTenorMonths: rng.bool(0.7) ? tenor : null,
      uwProcessType: rng.weighted(['Full U/W', 'Straight Through', 'Partial U/W'], [58, 28, 14]),
      offerEmploymentType: rng.weighted(['Salaried', 'Self Employed', 'Professional'], [52, 38, 10]),
      eligibleLtv: rng.pick([80, 85, 90, 95]),
      recommendedLtv: rng.pick([75, 80, 85, 90]),
      dealerRanking: rng.int(1, 5),
      businessEmploymentVerified: rng.bool(0.72) ? 'Yes' : '',
      creditManager: c.creditManager,
      riskCategory: c.risk,
      interestRatePct: roi,
      emi,
      processingFee: Math.round(c.loanAmount * 0.015),
      schemeCode: `SCH-${rng.letters(2)}${rng.digits(3)}`,
      branch: rng.pick(BRANCHES),
      sourcingChannel: rng.pick(SOURCING_CHANNELS),
      disbursalStatus:
        c.status === 'Disbursed'
          ? 'Disbursed'
          : c.status === 'Approved'
            ? 'Pending Disbursal'
            : 'Not Applicable',
      expectedDisbursalDate: isoDate(2026, rng.int(8, 12), rng.int(1, 28)),
    },

    workflow: makeWorkflow(rng, c.status),
  }
}
