/** Reference vocabularies used by the deterministic record generator. */

export const FIRST_NAMES_M = [
  'Aarav', 'Vikash', 'Rohit', 'Amit', 'Sandeep', 'Manish', 'Rakesh', 'Suresh',
  'Nikhil', 'Prashant', 'Ashish', 'Deepak', 'Gaurav', 'Harish', 'Imran',
  'Jitendra', 'Kunal', 'Lokesh', 'Mahesh', 'Naveen', 'Omkar', 'Pankaj',
  'Rajesh', 'Sachin', 'Tushar', 'Umesh', 'Varun', 'Yogesh', 'Abhijit', 'Bharat',
]

export const FIRST_NAMES_F = [
  'Sonali', 'Priya', 'Anjali', 'Kavita', 'Neha', 'Pooja', 'Rekha', 'Shweta',
  'Meena', 'Divya', 'Aarti', 'Bhavna', 'Chhaya', 'Deepika', 'Ekta', 'Geeta',
  'Hema', 'Ishita', 'Jyoti', 'Komal', 'Lata', 'Manisha', 'Nisha', 'Pallavi',
  'Rashmi', 'Sneha', 'Trupti', 'Vaishali', 'Yamini', 'Swati',
]

export const SURNAMES = [
  'Verma', 'Sharma', 'Patil', 'Deshmukh', 'Joshi', 'Kulkarni', 'Nair', 'Reddy',
  'Iyer', 'Chauhan', 'Gupta', 'Mehta', 'Shah', 'Rao', 'Naik', 'Bhosale',
  'Jadhav', 'Pawar', 'More', 'Shinde', 'Kadam', 'Thakur', 'Yadav', 'Mishra',
  'Tiwari', 'Pandey', 'Agarwal', 'Bansal', 'Kapoor', 'Malhotra',
]

export interface CityRef {
  city: string
  state: string
  pincodes: string[]
  rtoCode: string
}

export const CITIES: CityRef[] = [
  { city: 'NAGPUR', state: 'MAHARASHTRA', pincodes: ['440036', '440016', '440018', '440010'], rtoCode: 'MH40' },
  { city: 'PUNE', state: 'MAHARASHTRA', pincodes: ['411001', '411014', '411038', '411057'], rtoCode: 'MH12' },
  { city: 'MUMBAI', state: 'MAHARASHTRA', pincodes: ['400001', '400053', '400072', '400097'], rtoCode: 'MH02' },
  { city: 'NASHIK', state: 'MAHARASHTRA', pincodes: ['422001', '422009', '422011'], rtoCode: 'MH15' },
  { city: 'AHMEDABAD', state: 'GUJARAT', pincodes: ['380001', '380015', '380054'], rtoCode: 'GJ01' },
  { city: 'SURAT', state: 'GUJARAT', pincodes: ['395001', '395007', '395009'], rtoCode: 'GJ05' },
  { city: 'JAIPUR', state: 'RAJASTHAN', pincodes: ['302001', '302017', '302020'], rtoCode: 'RJ14' },
  { city: 'JODHPUR', state: 'RAJASTHAN', pincodes: ['342001', '342005'], rtoCode: 'RJ19' },
  { city: 'INDORE', state: 'MADHYA PRADESH', pincodes: ['452001', '452010', '452016'], rtoCode: 'MP09' },
  { city: 'BHOPAL', state: 'MADHYA PRADESH', pincodes: ['462001', '462016', '462039'], rtoCode: 'MP04' },
  { city: 'BENGALURU', state: 'KARNATAKA', pincodes: ['560001', '560037', '560066', '560103'], rtoCode: 'KA01' },
  { city: 'MYSURU', state: 'KARNATAKA', pincodes: ['570001', '570008'], rtoCode: 'KA09' },
  { city: 'HYDERABAD', state: 'TELANGANA', pincodes: ['500001', '500032', '500081'], rtoCode: 'TS09' },
  { city: 'CHENNAI', state: 'TAMIL NADU', pincodes: ['600001', '600042', '600096'], rtoCode: 'TN01' },
  { city: 'COIMBATORE', state: 'TAMIL NADU', pincodes: ['641001', '641014'], rtoCode: 'TN37' },
  { city: 'KOCHI', state: 'KERALA', pincodes: ['682001', '682018', '682030'], rtoCode: 'KL07' },
  { city: 'LUCKNOW', state: 'UTTAR PRADESH', pincodes: ['226001', '226010', '226016'], rtoCode: 'UP32' },
  { city: 'KANPUR', state: 'UTTAR PRADESH', pincodes: ['208001', '208012'], rtoCode: 'UP78' },
  { city: 'NOIDA', state: 'UTTAR PRADESH', pincodes: ['201301', '201309'], rtoCode: 'UP16' },
  { city: 'NEW DELHI', state: 'DELHI', pincodes: ['110001', '110019', '110058', '110092'], rtoCode: 'DL01' },
  { city: 'GURUGRAM', state: 'HARYANA', pincodes: ['122001', '122018'], rtoCode: 'HR26' },
  { city: 'CHANDIGARH', state: 'PUNJAB', pincodes: ['160001', '160022'], rtoCode: 'PB65' },
  { city: 'LUDHIANA', state: 'PUNJAB', pincodes: ['141001', '141010'], rtoCode: 'PB10' },
  { city: 'KOLKATA', state: 'WEST BENGAL', pincodes: ['700001', '700029', '700091'], rtoCode: 'WB02' },
  { city: 'PATNA', state: 'BIHAR', pincodes: ['800001', '800013'], rtoCode: 'BR01' },
]

export const LOCALITY_PREFIX = [
  'MHADA COLONY', 'RAJENDRA NAGAR', 'SHIVAJI NAGAR', 'GANDHI CHOWK',
  'SAI NAGAR', 'VIDYA VIHAR', 'ANAND NAGAR', 'LAXMI COLONY', 'RAM NAGAR',
  'KRISHNA VIHAR', 'GOKUL PARK', 'SUNRISE ENCLAVE', 'GREEN VALLEY',
  'ASHOK VIHAR', 'MODEL TOWN',
]

export const LANDMARKS = [
  'NEAR HANUMAN MANDIR', 'OPP. SBI BRANCH', 'BEHIND CITY MALL',
  'NEAR BUS DEPOT', 'ADJACENT TO ZP SCHOOL', 'NEXT TO PETROL PUMP',
  'NEAR WATER TANK', 'OPP. POLICE STATION', 'NEAR RAILWAY CROSSING',
]

export const BUSINESS_SUFFIX = [
  'CREATION', 'ENTERPRISES', 'TRADERS', 'INDUSTRIES', 'SERVICES',
  'MOTORS', 'AGENCIES', 'SOLUTIONS', 'TEXTILES', 'AUTOMOBILES',
]

export interface VehicleRef {
  make: string
  models: string[]
  category: string
  body: string
  priceBand: [number, number]
}

export const VEHICLES: VehicleRef[] = [
  { make: 'RENAULT', models: ['KWID 1.0 RXT AMT', 'TRIBER RXZ', 'KIGER RXT'], category: 'A2', body: 'HATCHBACK', priceBand: [420000, 780000] },
  { make: 'MARUTI SUZUKI', models: ['SWIFT VXI', 'BALENO ZETA', 'DZIRE VXI', 'BREZZA ZXI'], category: 'A3', body: 'HATCHBACK', priceBand: [560000, 1250000] },
  { make: 'HYUNDAI', models: ['I20 SPORTZ', 'CRETA EX', 'VENUE S', 'GRAND I10 NIOS'], category: 'A3', body: 'HATCHBACK', priceBand: [610000, 1480000] },
  { make: 'TATA', models: ['NEXON XM', 'PUNCH ADVENTURE', 'TIAGO XT', 'ALTROZ XZ'], category: 'A3', body: 'SUV', priceBand: [580000, 1320000] },
  { make: 'MAHINDRA', models: ['XUV300 W6', 'BOLERO B6', 'SCORPIO N Z4', 'THAR LX'], category: 'A4', body: 'SUV', priceBand: [890000, 1790000] },
  { make: 'HONDA', models: ['CITY V CVT', 'AMAZE S', 'ELEVATE SV'], category: 'A3', body: 'SEDAN', priceBand: [720000, 1450000] },
  { make: 'KIA', models: ['SELTOS HTK', 'SONET HTX', 'CARENS PRESTIGE'], category: 'A4', body: 'SUV', priceBand: [880000, 1690000] },
  { make: 'TOYOTA', models: ['GLANZA G', 'URBAN CRUISER', 'INNOVA CRYSTA GX'], category: 'A4', body: 'MUV', priceBand: [740000, 2150000] },
]

export const DEALERS = [
  'VALUEDRIVE TECHNOLOGIES PRIVATE LIMITED#PUNE#ZBT#9524293',
  'AUTOWHEELS INDIA LLP#NAGPUR#ZBT#8814402',
  'SPEEDLINE MOTORS PVT LTD#MUMBAI#ZBT#7742318',
  'PRIME CARS AND CO#JAIPUR#ZBT#6690154',
  'STARLINE AUTOMOTIVES#INDORE#ZBT#5518877',
  'GREENWAY VEHICLES PVT LTD#BENGALURU#ZBT#4432209',
]

export const CREDIT_MANAGERS = [
  'Shubham Deshmukh13', 'Anita Kulkarni07', 'Rahul Mehta21', 'Priya Nair04',
  'Vikram Rathore18', 'Sneha Joshi11', 'Arun Prasad09', 'Neelam Gupta15',
]

export const PRODUCTS = ['ZCUC', 'ZNUC', 'ZLAP', 'ZPL', 'ZBL']

export const PRODUCT_LABEL: Record<string, string> = {
  ZCUC: 'Used Car Loan',
  ZNUC: 'New Car Loan',
  ZLAP: 'Loan Against Property',
  ZPL: 'Personal Loan',
  ZBL: 'Business Loan',
}

export const STATUSES = [
  'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected',
  'Disbursed', 'On Hold',
] as const

export const RISKS = ['LOW', 'MEDIUM', 'HIGH'] as const

export const COLORS = ['WHITE', 'SILVER', 'GREY', 'RED', 'BLUE', 'BLACK', 'BROWN']

export const BANKS = [
  'HDFC BANK', 'ICICI BANK', 'STATE BANK OF INDIA', 'AXIS BANK',
  'KOTAK MAHINDRA BANK', 'BANK OF BARODA', 'IDFC FIRST BANK', 'YES BANK',
]

export const BRANCHES = [
  'NAGPUR MAIN', 'PUNE CAMP', 'MUMBAI ANDHERI', 'JAIPUR MI ROAD',
  'INDORE VIJAY NAGAR', 'BENGALURU KORAMANGALA', 'DELHI KAROL BAGH',
]

export const SOURCING_CHANNELS = ['Direct', 'DSA', 'Dealer', 'Digital', 'Branch Walk-in']

export const WORKFLOW_STAGES = [
  { key: 'fulfilment', label: 'Fulfilment Status' },
  { key: 'basic', label: 'Basic Details' },
  { key: 'bureau', label: 'Bureau' },
  { key: 'dedupe', label: 'Dedupe' },
  { key: 'work-profile', label: 'Work Profile' },
  { key: 'gen-ai', label: 'Gen AI Insight' },
  { key: 'ai-responses', label: 'AI Responses' },
  { key: 'banking', label: 'Banking' },
  { key: 'financials', label: 'Financials' },
  { key: 'obligations', label: 'Obligations' },
  { key: 'asset', label: 'Asset Details' },
  { key: 'loan', label: 'Loan Details' },
  { key: 'processing', label: 'Processing Conditions' },
  { key: 'pd', label: 'Personal Discussion' },
] as const
