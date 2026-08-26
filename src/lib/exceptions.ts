/**
 * Derives the "things a credit user should look at first" strip.
 *
 * In the source screens these signals are scattered across five tabs and are
 * easy to miss — a blacklisted RC sits in a field near the bottom of the asset
 * tab, a DPD history is two clicks deep. Pulling them into one ranked strip is
 * the single biggest usability gain over the original layout.
 */

import type { Application } from '@/api'

export type Severity = 'critical' | 'warning' | 'info'

export interface Exception {
  id: string
  severity: Severity
  title: string
  detail: string
  /** Tab the user should jump to in order to act on it. */
  tab: string
}

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function deriveExceptions(app: Application): Exception[] {
  const out: Exception[] = []

  /* --- Identity / KYC ---------------------------------------------- */

  if (app.demographics.cibilAddressCheck === 'NO MATCH') {
    out.push({
      id: 'cibil-address',
      severity: 'warning',
      title: 'CIBIL address mismatch',
      detail: 'The declared address does not match the bureau record.',
      tab: 'addresses',
    })
  }

  if (app.demographics.ekycConsentStatus === 'Declined') {
    out.push({
      id: 'ekyc',
      severity: 'critical',
      title: 'eKYC consent declined',
      detail: 'Cannot proceed to disbursal without consent.',
      tab: 'basic',
    })
  }

  if (app.demographics.profileClassification === 'Negative Profile') {
    out.push({
      id: 'profile-negative',
      severity: 'critical',
      title: 'Negative profile classification',
      detail: 'Applicant is flagged in the negative profile master.',
      tab: 'basic',
    })
  } else if (app.demographics.profileClassification === 'Sensitive Profile') {
    out.push({
      id: 'profile-sensitive',
      severity: 'warning',
      title: 'Sensitive profile',
      detail: 'Requires senior credit sign-off before approval.',
      tab: 'basic',
    })
  }

  if (app.contact.mobileStatus === 'Failed') {
    out.push({
      id: 'mobile',
      severity: 'warning',
      title: 'Mobile verification failed',
      detail: 'The registered mobile could not be verified.',
      tab: 'basic',
    })
  }

  /* --- Address ------------------------------------------------------ */

  const cur = app.addresses.current
  const perm = app.addresses.permanent
  if (!perm.currentSameAsPermanent && cur.pincode !== perm.pincode) {
    out.push({
      id: 'address-diff',
      severity: 'info',
      title: 'Permanent address differs from current',
      detail: `Current ${cur.pincode} · Permanent ${perm.pincode}. FI verification may be triggered.`,
      tab: 'addresses',
    })
  }

  if (app.cpvElimination.salesStatus === 'Not Recommended') {
    out.push({
      id: 'cpv-sales',
      severity: 'warning',
      title: 'CPV sales status: not recommended',
      detail: 'The sales verification visit returned a negative recommendation.',
      tab: 'addresses',
    })
  }

  if (app.cpvElimination.creditStatus === 'Negative') {
    out.push({
      id: 'cpv',
      severity: 'critical',
      title: 'CPV credit status negative',
      detail: 'Contact point verification returned a negative outcome.',
      tab: 'addresses',
    })
  }

  /* --- Dedupe / exposure -------------------------------------------- */

  const strongMatch = app.dedupe.matches.find((m) => m.matchedFields.length >= 3)
  if (strongMatch) {
    out.push({
      id: 'dedupe-strong',
      severity: 'warning',
      title: 'Strong dedupe match found',
      detail: `Customer ${strongMatch.customerId} matches on ${strongMatch.matchedFields.length} parameters.`,
      tab: 'dedupe',
    })
  }

  if (app.dedupe.matches.some((m) => m.isParallel === 'Yes')) {
    out.push({
      id: 'parallel',
      severity: 'warning',
      title: 'Parallel application detected',
      detail: 'Another live application exists for a matched customer.',
      tab: 'dedupe',
    })
  }

  const overdue = app.dedupe.bflExposure.filter((e) => e.status === 'Overdue')
  if (overdue.length) {
    out.push({
      id: 'exposure-overdue',
      severity: 'critical',
      title: `${overdue.length} overdue BFL loan${overdue.length > 1 ? 's' : ''}`,
      detail: 'Existing exposure is in arrears.',
      tab: 'dedupe',
    })
  }

  const worstDpd = Math.max(0, ...app.dedupe.bflTrackRecords.map((t) => t.maxDpd))
  if (worstDpd >= 90) {
    out.push({
      id: 'dpd',
      severity: 'critical',
      title: `${worstDpd} DPD on prior BFL loan`,
      detail: 'Severe delinquency in the track record.',
      tab: 'dedupe',
    })
  } else if (worstDpd >= 30) {
    out.push({
      id: 'dpd',
      severity: 'warning',
      title: `${worstDpd} DPD on prior BFL loan`,
      detail: 'Repayment history shows delinquency.',
      tab: 'dedupe',
    })
  }

  const familyDpd = Math.max(0, ...app.dedupe.familyDedupe.map((f) => f.worstDpd))
  if (familyDpd >= 60) {
    out.push({
      id: 'family-dpd',
      severity: 'warning',
      title: `Family member at ${familyDpd} DPD`,
      detail: 'A linked family record shows delinquency.',
      tab: 'dedupe',
    })
  }

  /* --- Asset -------------------------------------------------------- */

  if (app.vahan.blacklistDetails) {
    out.push({
      id: 'blacklist',
      severity: 'critical',
      title: 'Vehicle blacklisted on Vahan',
      detail: app.vahan.blacklistDetails,
      tab: 'asset',
    })
  }

  if (app.asset.vahanDetailsMatchingWithRc === 'No') {
    out.push({
      id: 'vahan-mismatch',
      severity: 'warning',
      title: 'Vahan details do not match RC',
      detail: 'Registration data differs from the submitted RC.',
      tab: 'asset',
    })
  }

  if (app.asset.accidentalVehicle === 'Yes') {
    out.push({
      id: 'accidental',
      severity: 'warning',
      title: 'Accidental vehicle',
      detail: 'Asset has an accident history — revaluation advised.',
      tab: 'asset',
    })
  }

  if (app.asset.assetDedupeDisposition === 'Refer') {
    out.push({
      id: 'asset-dedupe',
      severity: 'warning',
      title: 'Asset dedupe: refer',
      detail: 'This chassis/registration appears on another application.',
      tab: 'asset',
    })
  }

  /* --- Loan --------------------------------------------------------- */

  const val = app.valuation.valuation
  if (typeof val === 'number' && val > 0) {
    const ltv = Math.round((app.loan.loanAmount / val) * 100)
    const cap = app.loan.recommendedLtv ?? app.loan.eligibleLtv
    if (cap && ltv > cap) {
      out.push({
        id: 'ltv',
        severity: 'critical',
        title: `LTV ${ltv}% exceeds recommended ${cap}%`,
        detail: `Loan ₹${app.loan.loanAmount.toLocaleString('en-IN')} against valuation ₹${val.toLocaleString('en-IN')}.`,
        tab: 'loan',
      })
    }
  }

  if (app.valuation.valuationStatus === 'Not Initiated') {
    out.push({
      id: 'valuation',
      severity: 'info',
      title: 'Valuation not initiated',
      detail: 'Asset valuation is still pending.',
      tab: 'asset',
    })
  }

  if (!app.loan.businessEmploymentVerified) {
    out.push({
      id: 'employment',
      severity: 'info',
      title: 'Employment not yet verified',
      detail: 'Business / employment verification is outstanding.',
      tab: 'loan',
    })
  }

  return out.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}
