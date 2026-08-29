import type { Application } from '@/api'
import { DataSection, type FieldDef } from '@/components/DataSection'
import { Pill } from '@/components/primitives'

const DEMOGRAPHIC_FIELDS: FieldDef[] = [
  { key: 'prefixSalutation', label: 'Prefix/Salutation', type: 'select', options: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'M/s'] },
  { key: 'firstName', label: 'First Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'lastNameEntityName', label: 'Last Name / Entity Name' },

  { key: 'dateOfBirthIncorporation', label: 'Date of Birth / Incorporation', type: 'date', mono: true },
  { key: 'ageInYearAndMonth', label: 'Age in Year and Month', editable: false },
  { key: 'nameAsPerPan', label: 'Name As Per PAN', editable: false },
  { key: 'dobDoiAsPerPan', label: 'DOB/DOI as per PAN', type: 'date', mono: true, editable: false },

  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { key: 'bflCustomerType', label: 'BFL Customer Type', type: 'select', options: ['Existing', 'New to BFL'] },
  { key: 'customerType', label: 'Customer Type', type: 'select', options: ['Individual', 'Non-Individual'] },
  {
    key: 'applicantType',
    label: 'Applicant Type',
    type: 'select',
    options: ['Primary', 'Co-Applicant', 'Guarantor'],
    render: (v) => <Pill tone="bg-brand-50 text-brand-700 ring-brand-200">{String(v)}</Pill>,
  },

  { key: 'customerId', label: 'Customer ID', mono: true, editable: false },
  { key: 'pan', label: 'PAN', mono: true },
  { key: 'applicantConstitution', label: 'Applicant Constitution', type: 'select', options: ['Individual', 'Proprietorship', 'Partnership', 'Pvt Ltd'] },
  { key: 'isBeneficialOwner', label: 'Is Beneficial Owner', type: 'bool' },

  { key: 'beneficialOwnerSharePct', label: 'Beneficial Owner Share holder %', type: 'number', mono: true },
  { key: 'profile', label: 'Profile', type: 'select', options: ['Non Agri Profile', 'Agri Profile'] },
  {
    key: 'profileClassification',
    label: 'Profile Classification',
    type: 'select',
    options: ['Normal Profile', 'Sensitive Profile', 'Negative Profile'],
    flag: (v) =>
      v === 'Negative Profile'
        ? 'Flagged in the negative master'
        : v === 'Sensitive Profile'
          ? 'Needs senior credit sign-off'
          : null,
  },
  { key: 'applicantModified', label: 'Applicant Modified', type: 'bool' },

  { key: 'relationshipType', label: 'Relationship Type', type: 'select', options: ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter'] },
  { key: 'productName', label: 'Product Name', editable: false },
  { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Married', 'Single', 'Widowed', 'Divorced'] },
  { key: 'cinNumber', label: 'CIN Number', mono: true , editable: false },

  { key: 'ovdRegistrationType', label: 'OVD / Registration Type', type: 'select', options: ['Aadhaar', 'Passport', 'Voter ID', 'Driving License'] },
  // { key: 'vintageAtBusinessPlace', label: 'Vintage at Business Place (yrs)', type: 'number', mono: true },
  { key: 'ekycConsentStatus', label: 'eKYC Consent Status', type: 'select', options: ['Approved', 'Pending', 'Declined'], flag: (v) => (v === 'Declined' ? 'Blocks disbursal' : null),editable: false},
  {
    key: 'cibilAddressCheck',
    label: 'CIBIL Address Check',
    editable: false,
    render: (v) => (
      <Pill
        tone={
          v === 'MATCH'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : v === 'NO MATCH'
              ? 'bg-rose-50 text-rose-700 ring-rose-200'
              : 'bg-slate-100 text-slate-600 ring-slate-200'
        }
      >
        {String(v)}
      </Pill>
    ),
  },

  { key: 'cibilUidaiCheck', label: 'CIBIL UIDAI Check', editable: false },
  { key: 'msmeClassification', label: 'MSME Classification', type: 'select', options: ['Yes', 'No'],editable: false },
  { key: 'msmeType', label: 'MSME Type', type: 'select', options: ['Micro', 'Small', 'Medium'] },
  { key: 'nicCode', label: 'NIC Code', mono: true, editable: false },

  { key: 'udhyamRegistrationNo', label: 'Udhyam Registration No', mono: true, editable: false },
  { key: 'dinNumber', label: 'DIN Number', mono: true, editable: false },
  { key: 'kycPodStatus', label: 'KYC POD Status', type: 'select', options: ['Search Initiated', 'Completed', 'Pending'],editable: false },
]

const LEI_FIELDS: FieldDef[] = [
  { key: 'leiNumber', label: 'LEI Number', mono: true, span: false },
  { key: 'leiRegistrationStatus', label: 'LEI Registration Status', type: 'select', options: ['ISSUED', 'LAPSED', 'PENDING'] },
  { key: 'leiExpiryDate', label: 'LEI Expiry Date', type: 'date', mono: true },
]

const CONTACT_FIELDS: FieldDef[] = [
  { key: 'mobileNumber', label: 'Mobile Number', mono: true },
  { key: 'alternateMobileNumber', label: 'Alternate Mobile Number', mono: true },
  { key: 'emailId', label: 'Email ID' },
  {
    key: 'mobileStatus',
    label: 'Mobile Status',
    type: 'select',
    options: ['Not Initiated', 'Verified', 'Failed'],
    flag: (v) => (v === 'Failed' ? 'Verification failed' : null),
  },
  { key: 'mobileResponse', label: 'Mobile Response', editable: false, span: true },
]

export default function BasicDetailsTab({ app }: { app: Application }) {
  const isHighTicket = app.loan.loanAmount >= 1_500_000

  return (
    <div className="space-y-4">
      <DataSection
        title="Demographic Details"
        subtitle={`${app.demographics.prefixSalutation} ${app.applicantName} · Customer ID ${app.demographics.customerId}`}
        fields={DEMOGRAPHIC_FIELDS}
        values={app.demographics as unknown as Record<string, unknown>}
        record={app}
        section="demographics"
      />

      {isHighTicket && (
        <DataSection
          title="LEI Details"
          subtitle="Captured for high-ticket cases only"
          fields={LEI_FIELDS}
          values={app.demographics as unknown as Record<string, unknown>}
          record={app}
          section="demographics"
          cols={3}
        />
      )}

      <DataSection
        title="Contact Details"
        fields={CONTACT_FIELDS}
        values={app.contact as unknown as Record<string, unknown>}
        record={app}
        section="contact"
      />
    </div>
  )
}
