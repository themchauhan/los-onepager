/**
 * Domain model for the LOS one-pager.
 *
 * Field names mirror the labels shown in the source LOS screens so the mapping
 * to a real backend payload stays obvious. Every field is optional-tolerant:
 * real LOS records are sparse, and the UI renders a dash for anything empty.
 */

export type Nullable<T> = T | null | undefined

/* ------------------------------------------------------------------ */
/* Demographics                                                        */
/* ------------------------------------------------------------------ */

export interface DemographicDetails {
  prefixSalutation: string
  firstName: string
  middleName: string
  lastNameEntityName: string
  dateOfBirthIncorporation: string // ISO yyyy-mm-dd
  ageInYearAndMonth: string
  nameAsPerPan: string
  dobDoiAsPerPan: string
  gender: 'Male' | 'Female' | 'Other'
  bflCustomerType: string
  customerType: string
  applicantType: 'Primary' | 'Co-Applicant' | 'Guarantor'
  customerId: string
  pan: string
  applicantConstitution: string
  isBeneficialOwner: boolean
  beneficialOwnerSharePct: Nullable<number>
  profile: string
  profileClassification: string
  applicantModified: boolean
  relationshipType: string
  productName: string
  maritalStatus: string
  cinNumber: string
  ovdRegistrationType: string
  vintageAtBusinessPlace: Nullable<number>
  ekycConsentStatus: string
  cibilAddressCheck: 'MATCH' | 'NO MATCH' | 'NOT INITIATED'
  cibilUidaiCheck: string
  msmeClassification: string
  msmeType: string
  nicCode: string
  udhyamRegistrationNo: string
  dinNumber: string
  kycPodStatus: string
  /** LEI is captured only for high-ticket cases. */
  leiNumber: string
  leiRegistrationStatus: string
  leiExpiryDate: string
}

export interface ContactDetails {
  mobileNumber: string
  alternateMobileNumber: string
  emailId: string
  mobileStatus: string
  mobileResponse: string
}

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

export type AddressKind = 'current' | 'permanent' | 'office' | 'gst'

export interface Address {
  addressLine1: string
  addressLine2: string
  addressLine3: string
  pincode: string
  area: string
  locality: string
  city: string
  landmark: string
  state: string
  district: string
  addressType: string
  residenceType: string
  source: string
  addressModified: boolean
  addressProofSubmitted: string
  documentNumber: string
  documentExpiryDate: string
  isMailingAddress: boolean
  addressEnrichment: string
  yearsOfOccupancy: Nullable<number>
  currentSameAsPermanent: boolean
}

export interface CpvElimination {
  salesStatus: string
  creditStatus: string
  geoTaggedVerificationStatus: string
}

export interface GeoTaggingDetails {
  image1GeoLocation: string
  image2GeoLocation: string
  image3GeoLocation: string
}

/* ------------------------------------------------------------------ */
/* Dedupe                                                              */
/* ------------------------------------------------------------------ */

/** The columns the dedupe engine can match on. */
export type MatchParameter =
  | 'name'
  | 'dob'
  | 'pan'
  | 'mobile'
  | 'address'
  | 'bankAccountNo'
  | 'aadhaar'
  | 'voterIdDlPassport'
  | 'customerAddress'
  | 'customerName'

export interface DedupeCustomerRow {
  customerId: string
  customerName: string
  dob: string
  mobile: string
  pan: string
  currentResidenceAddress: string
  permanentAddress: string
  bankAccountNo: string
  aadhaar: string
  ovdDetails: string
}

export interface DedupeMatchRow extends DedupeCustomerRow {
  loanDetailsRef: string
  isMfi: 'Yes' | 'No'
  isParallel: 'Yes' | 'No'
  /** Which fields matched the source record — drives the green highlight. */
  matchedFields: MatchParameter[]
}

export interface BflExposureRow {
  loanAccountNo: string
  product: string
  sanctionedAmount: number
  outstanding: number
  emi: number
  status: string
  disbursalDate: string
}

export interface FamilyDedupeRow {
  customerId: string
  customerName: string
  relationship: string
  mobile: string
  pan: string
  activeLoans: number
  totalOutstanding: number
  worstDpd: number
}

export interface BflTrackRecordRow {
  loanAccountNo: string
  product: string
  emisPaid: number
  emisBounced: number
  currentDpd: number
  maxDpd: number
  closureType: string
}

export interface DedupeSection {
  currentCustomer: DedupeCustomerRow
  matches: DedupeMatchRow[]
  matchingParameters: MatchParameter[]
  bflExposure: BflExposureRow[]
  familyDedupe: FamilyDedupeRow[]
  bflTrackRecords: BflTrackRecordRow[]
}

/* ------------------------------------------------------------------ */
/* Asset + Vahan                                                       */
/* ------------------------------------------------------------------ */

export interface AssetDetails {
  asset: string
  dealerName: string
  carMake: string
  carModel: string
  vehicleCategory: string
  assetCategory: string
  carRegNo: string
  carMfgDate: string
  carAgeInMonths: Nullable<number>
  rcFcExpiry: string
  engineNo: string
  chassisNo: string
  ownerNoAsPerRc: Nullable<number>
  kilometersRun: Nullable<number>
  accidentalVehicle: string
  fuelType: string
  color: string
  nameOfTheOwner: string
  rcIssuingCity: string
  currentHypothecation: string
  currentHypothecationIfOthers: string
  btBankName: string
  vahanDetailsMatchingWithRc: 'Yes' | 'No'
  dealerOwnerContactNumber: string
  dealerVehicleOwnerName: string
  streetName: string
  pincode: string
  typeOfVehicle: string
  carPurchasePrice: Nullable<number>
  nocAlreadyIssuedByRto: 'Yes' | 'No'
  assetDedupeDisposition: string
  vahanVehicleExpiryDate: string
  vahanInsuranceExpiryDate: string
}

export interface VahanDetails {
  registrationNumber: string
  chassisNumber: string
  fitnessValidUpto: string
  financierName: string
  engineNumber: string
  ownerSrNo: Nullable<number>
  ownerName: string
  makerModel: string
  rcIssuingCity: string
  vehicleMakerDescription: string
  bodyTypeDescription: string
  state: string
  vehicleManufacturerDate: string
  blacklistDetails: string
}

export interface ValuationApiDetails {
  valuation: Nullable<number>
  valuationStatus: string
  requestNumber: string
  pdfUrl: string
  valuationAgency: string
  valuationDate: string
}

/* ------------------------------------------------------------------ */
/* Loan                                                                */
/* ------------------------------------------------------------------ */

export interface LoanDetails {
  loanAmount: number
  requestedLoanAmount: number
  requestedLoanTenorMonths: number
  approvedTenorMonths: Nullable<number>
  uwProcessType: string
  offerEmploymentType: string
  eligibleLtv: Nullable<number>
  recommendedLtv: Nullable<number>
  dealerRanking: Nullable<number>
  businessEmploymentVerified: string
  creditManager: string
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH'
  interestRatePct: number
  emi: number
  processingFee: number
  schemeCode: string
  branch: string
  sourcingChannel: string
  disbursalStatus: string
  expectedDisbursalDate: string
}

/* ------------------------------------------------------------------ */
/* Workflow                                                            */
/* ------------------------------------------------------------------ */

export type StageStatus = 'complete' | 'in-progress' | 'pending' | 'flagged'

export interface WorkflowStage {
  key: string
  label: string
  status: StageStatus
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Disbursed'
  | 'On Hold'

/* ------------------------------------------------------------------ */
/* Aggregate                                                           */
/* ------------------------------------------------------------------ */

/** The lean shape returned by the list endpoint — one row in the grid. */
export interface ApplicationSummary {
  id: string
  applicationNo: string
  applicantName: string
  customerId: string
  pan: string
  mobile: string
  product: string
  loanAmount: number
  city: string
  state: string
  status: ApplicationStatus
  riskCategory: LoanDetails['riskCategory']
  creditManager: string
  createdAt: string // ISO
  updatedAt: string // ISO
}

/** The full record returned by the detail endpoint. */
export interface Application extends ApplicationSummary {
  demographics: DemographicDetails
  contact: ContactDetails
  addresses: Record<AddressKind, Address>
  cpvElimination: CpvElimination
  geoTagging: GeoTaggingDetails
  dedupe: DedupeSection
  asset: AssetDetails
  vahan: VahanDetails
  valuation: ValuationApiDetails
  loan: LoanDetails
  workflow: WorkflowStage[]
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

export interface ListParams {
  page: number // 1-based
  pageSize: number
  search?: string
  status?: ApplicationStatus | 'All'
  product?: string | 'All'
  risk?: LoanDetails['riskCategory'] | 'All'
  state?: string | 'All'
  sortBy?: keyof ApplicationSummary
  sortDir?: 'asc' | 'desc'
}

export interface Page<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
  /** Milliseconds the "server" spent on the query — shown in the UI footer. */
  tookMs: number
}

export interface FacetOptions {
  statuses: ApplicationStatus[]
  products: string[]
  risks: Array<LoanDetails['riskCategory']>
  states: string[]
}

/** A patch targets one editable section of the record. */
export type EditableSection =
  | 'demographics'
  | 'contact'
  | 'address.current'
  | 'address.permanent'
  | 'address.office'
  | 'address.gst'
  | 'cpvElimination'
  | 'asset'
  | 'vahan'
  | 'loan'

export interface PatchRequest {
  id: string
  section: EditableSection
  values: Record<string, unknown>
}

/**
 * The single seam between the UI and the data source.
 *
 * `mockApi` implements this today; `httpApi` implements it against a real
 * backend. Nothing in the UI imports either one directly — see `api/index.ts`.
 */
export interface ApiClient {
  listApplications(params: ListParams): Promise<Page<ApplicationSummary>>
  getApplication(id: string): Promise<Application>
  patchApplication(req: PatchRequest): Promise<Application>
  getFacets(): Promise<FacetOptions>
  getStats(): Promise<{
    total: number
    byStatus: Record<string, number>
    byRisk: Record<string, number>
    totalBookValue: number
  }>
}
