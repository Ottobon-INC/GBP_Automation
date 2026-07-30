const { google } = require('googleapis');
const path = require('path');

const SPREADSHEET_ID = '1UcoZ5Am5n_zVmscQQX--GJqE5csXF4r7qs87ZvuQHvo';
const KEY_FILE_PATH = path.join(__dirname, '.service-account-key.json');

const INITIAL_ROWS = [
  [
    'Category Type',
    'Niche / Department',
    'AI Recommended Keywords',
    'Recommended Google Categories',
    'Seasonal FAQs',
    'Status'
  ],
  [
    'Healthcare',
    'IVF & Fertility Center',
    'best ivf center near me, ivf success rates, fertility clinic visakhapatnam, test tube baby clinic, male infertility treatment, icsi procedure cost, best gynecologist for pregnancy, ivf specialist doctor, low fertility cost',
    'IVF & Fertility Center, Maternity Clinic, Women\'s Health Clinic, Medical Clinic',
    'What is the success rate of IVF treatment? | What is the cost of IVF cycle in Visakhapatnam? | How long does an IVF process take from start to pregnancy?',
    'Approved'
  ],
  [
    'Healthcare',
    'Dermatology & Skin Clinic',
    'best dermatologist near me, laser hair removal clinic, acne treatment specialist, skin whitening treatment, anti aging treatment clinic, hair fall specialist doctor, best skin clinic in vizag, best cosmetologist near me',
    'Dermatology Clinic, Skin Care Clinic, Medical Spa, Hair Replacement Service',
    'How many sessions of laser hair removal are required? | What is the best treatment for acne scars? | Do you offer PRP therapy for hair loss?',
    'Approved'
  ],
  [
    'Healthcare',
    'Dental Clinic',
    'best dentist near me, painless root canal treatment, invisible teeth braces cost, dental implants clinic, teeth whitening clinic near me, pediatric dentist in vizag, best orthodontic clinic, emergency dental clinic',
    'Dental Clinic, Dentist, Orthodontist, Cosmetic Dentist, Pediatric Dentist',
    'How much does a dental implant cost? | Is root canal treatment painful? | How long do clear aligners take to straighten teeth?',
    'Approved'
  ],
  [
    'Healthcare',
    'Multi-Specialty Hospital',
    'best multi specialty hospital near me, 24/7 emergency hospital in vizag, top hospital for cardiology, best general surgery hospital, critical care unit hospital, affordable healthcare clinic, accident and emergency care',
    'General Hospital, Medical Center, Emergency Room, Surgical Center',
    'Do you accept cashless health insurance? | Are 24/7 emergency and ICU facilities available? | How do I book an online appointment with a senior consultant?',
    'Approved'
  ],
  [
    'Healthcare',
    'Eye / Ophthalmology Hospital',
    'best eye hospital near me, bladeless lasik surgery cost, cataract surgery specialist, pediatric ophthalmologist near me, glaucoma treatment hospital, best laser eye surgeon in vizag, retina specialist hospital',
    'Eye Care Center, Ophthalmologist, Laser Vision Correction Center, Optometrist',
    'What is the recovery time after LASIK eye surgery? | Is cataract surgery covered by health insurance? | At what age should a child get their first eye exam?',
    'Approved'
  ],
  [
    'Healthcare',
    'Orthopedic Clinic',
    'best orthopedic doctor near me, knee replacement surgery hospital, joint pain specialist clinic, spine surgery hospital in vizag, sports injury rehabilitation clinic, fracture treatment clinic, best bone specialist doctor',
    'Orthopedic Clinic, Orthopedic Surgeon, Sports Medicine Clinic, Physical Therapy Clinic',
    'What is the recovery period after total knee replacement? | What are the non-surgical treatments for back pain? | Do you offer physiotherapy after fracture removal?',
    'Approved'
  ],
  [
    'Education',
    'Engineering College',
    'best engineering college in andhra pradesh, btech admission 2026, top placements engineering college, computer science engineering seat, autonomous engineering college in vizag, best eamcet rank college, campus placement records',
    'Engineering College, University, Technical School, Higher Secondary School',
    'What was the highest package offered in last year placements? | What is the EAMCET cutoff rank for CSE branch? | Are hostel facilities available for outstation students?',
    'Approved'
  ],
  [
    'Education',
    'Junior College (Intermediate)',
    'best junior college in visakhapatnam, mpc biyc intermediate admission, top iit jee coaching junior college, neet residential junior college, best faculty intermediate college, strict disciplined college for intermediate',
    'Junior College, Educational Institution, High School, Coaching Center',
    'Do you provide integrated IIT-JEE and NEET coaching with regular classes? | What are the timings for day scholar students? | What is the fee structure for MPC and BiPC groups?',
    'Approved'
  ],
  [
    'Education',
    'Degree College',
    'best degree college near me, bsc computer science admission, bcom degree college in vizag, top campus placement degree college, best autonomous degree college, bba degree admission 2026',
    'Degree College, Educational Institution, University, Commerce School',
    'What undergraduate degree specializations are offered? | Does the college provide campus recruitment training (CRT)? | Is there a scholarship facility for meritorious students?',
    'Approved'
  ],
  [
    'Education',
    'CBSE / ICSE School',
    'best cbse school in visakhapatnam, top residential school near me, holistic education school, english medium school admission 2026, best sports facility school, smart classroom school in vizag, international curriculum school',
    'School, Elementary School, High School, Educational Institution',
    'What is the student-to-teacher ratio in primary classes? | What extracurricular activities and sports are offered? | What is the admission procedure for Academic Year 2026-27?',
    'Approved'
  ],
  [
    'Education',
    'AI & Software Training Institute',
    'best ai training institute in vizag, artificial intelligence course with placement, full stack development bootcamp, python machine learning course, generative ai certification institute, data science coaching center near me',
    'Training Institute, Software Training Institute, Computer Training School, Vocational School',
    'Do you provide 100% placement assistance after course completion? | Are real-world live projects included in the AI curriculum? | What is the duration and fee of the Full Stack AI course?',
    'Approved'
  ],
  [
    'Education',
    'NEET / JEE Coaching Center',
    'best neet coaching center near me, iit jee advanced coaching in vizag, long term neet coaching academy, repeaters batch for neet 2026, highest selection rate coaching center, expert faculty for jee chemistry physics',
    'Coaching Center, Tutoring Service, Educational Institution, Learning Center',
    'What is the selection ratio of your institute in NEET/JEE last year? | Do you conduct weekly mock tests and personalized doubt-clearing sessions? | Are separate hostel facilities available for boys and girls?',
    'Approved'
  ]
];

async function main() {
  console.log('Authenticating with Google Sheets API using Service Account...');
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`Connecting to Google Sheet ID: ${SPREADSHEET_ID}...`);
  // 1. Get sheet metadata to find the exact tab title (e.g. Sheet1)
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID
  });

  const firstSheetTitle = meta.data.sheets[0].properties.title;
  console.log(`Found first sheet tab title: "${firstSheetTitle}"`);

  // 2. Clear existing cells in that tab
  console.log('Clearing existing data...');
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${firstSheetTitle}!A1:Z100`
  });

  // 3. Populate all initial rows
  console.log('Populating 12 Secret Sauce Niche Trends rows into Google Sheet...');
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${firstSheetTitle}!A1:F${INITIAL_ROWS.length}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: INITIAL_ROWS
    }
  });

  console.log('SUCCESS! Google Sheet has been populated cleanly in separate columns!');
  console.log(`Updated ${res.data.updatedCells} cells across ${res.data.updatedRows} rows.`);
}

main().catch(err => {
  console.error('ERROR populating sheet:', err.message || err);
  process.exit(1);
});
