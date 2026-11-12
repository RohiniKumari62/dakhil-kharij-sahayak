// Seed script for Dakhil-Kharij Sahayak
// Generates 3 demo users and 15 realistic synthetic mutation cases in Bihar

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { addWorkingDays, dueDate } from '../src/lib/workflow/sla';
import type { Role, Step, Status } from '../src/lib/workflow/types';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const slaDays = parseInt(process.env.SLA_DAYS || '30', 10);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface DemoUser {
  email: string;
  name: string;
  role: Role;
}

const DEMO_USERS: DemoUser[] = [
  { email: 'karamchari@demo.test', name: 'राजेश कुमार', role: 'halka_karamchari' },
  { email: 'ro@demo.test', name: 'सुनीता देवी', role: 'revenue_officer' },
  { email: 'co@demo.test', name: 'अनिल प्रसाद', role: 'circle_officer' },
];

const DEMO_PASSWORD = 'Demo@12345';

interface SeedAppSpec {
  case_no: string;
  applicant_name: string;
  applicant_phone: string;
  transaction_type: 'SALE' | 'INHERITANCE' | 'GIFT';
  mauza: string;
  khata_no: string;
  khesra_no: string;
  area_decimal: number;
  deed_no: string;
  deed_date: string;
  received_on: string;
  current_step: Step;
  status: Status;
  deed_text: string;
  note?: string;
  hasReturnedHistory?: boolean;
}

// 15 Synthetic cases
const SEED_APPLICATIONS: SeedAppSpec[] = [
  // 1. SCRUTINY - Overdue
  {
    case_no: 'DK-2026-0001',
    applicant_name: 'रामेश्वर सिंह',
    applicant_phone: '9876500001',
    transaction_type: 'SALE',
    mauza: 'रामपुर बुजुर्ग',
    khata_no: '45',
    khesra_no: '112',
    area_decimal: 15.5,
    deed_no: '1042/2026',
    deed_date: '2026-01-10',
    received_on: '2026-01-15',
    current_step: 'SCRUTINY',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: शिवचरण महतो, पिता- स्वर्गीय गणेश महतो
क्रेता: रामेश्वर सिंह, पिता- जगरनाथ सिंह
मौजा: रामपुर बुजुर्ग, थाना नं.- 112, अंचल- डेमो अंचल
खाता संख्या: 45, खेसरा संख्या: 112, रकबा: 15.5 डिसमिल
दस्तावेज संख्या: 1042/2026, निबंधन तिथि: 10-01-2026
चौहद्दी: उत्तर- निज विक्रेता, दक्षिण- सड़क आम, पूरब- सुखदेव राय, पश्चिम- नहर।
विक्रेता ने पूर्ण प्रतिफल प्राप्त कर स्वत्व त्याग दिया है।`,
  },
  // 2. SCRUTINY - Tricky Case A: Registration delay > 90 days
  {
    case_no: 'DK-2026-0002',
    applicant_name: 'मो० कलीम अंसारी',
    applicant_phone: '9876500002',
    transaction_type: 'SALE',
    mauza: 'चक सिकंदर',
    khata_no: '88',
    khesra_no: '304',
    area_decimal: 8.0,
    deed_no: '512/2025',
    deed_date: '2025-08-10', // Deed date > 120 days before receipt
    received_on: '2026-04-10',
    current_step: 'SCRUTINY',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: बशीर अहमद, पिता- गुलाम रसूल
क्रेता: मो० कलीम अंसारी, पिता- नज़ीर अंसारी
मौजा: चक सिकंदर, तौजी नं.- 4152, अंचल- डेमो अंचल
खाता संख्या: 88, खेसरा संख्या: 304, कुल रकबा: 8.0 डिसमिल
दस्तावेज संख्या: 512/2025, निबंधन तिथि: 10-08-2025
चौहद्दी: उत्तर- अब्दुल गफ्फार, दक्षिण- पक्की सड़क, पूरब- खाली जमीन, पश्चिम- रहीम खां।
उक्त भूमि पर क्रेता को दखल-कब्जा दे दिया गया है।`,
  },
  // 3. SCRUTINY - Tricky Case B: Area mismatch (deed text says 14 decimal, petition says 12)
  {
    case_no: 'DK-2026-0003',
    applicant_name: 'विन्देश्वरी प्रसाद',
    applicant_phone: '9876500003',
    transaction_type: 'SALE',
    mauza: 'गोपालपुर',
    khata_no: '12',
    khesra_no: '76',
    area_decimal: 12.0, // Petition says 12
    deed_no: '889/2026',
    deed_date: '2026-04-02',
    received_on: '2026-04-12',
    current_step: 'SCRUTINY',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: नगीना सिंह, पिता- रामदेव सिंह
क्रेता: विन्देश्वरी प्रसाद, पिता- लखन प्रसाद
मौजा: गोपालपुर, अंचल- डेमो अंचल
खाता संख्या: 12, खेसरा संख्या: 76, बिक्रित रकबा: 14 डिसमिल
दस्तावेज संख्या: 889/2026, दिनांक: 02-04-2026
चौहद्दी: उत्तर- ललन यादव, दक्षिण- कच्ची गली, पूरब- निज, पश्चिम- रामवृक्ष।
विक्रेता की जमाबंदी संख्या 14 से उक्त रकबा हस्तगत किया गया।`,
  },
  // 4. SCRUTINY - On Track
  {
    case_no: 'DK-2026-0004',
    applicant_name: 'शारदा देवी',
    applicant_phone: '9876500004',
    transaction_type: 'GIFT',
    mauza: 'बहादुरपुर',
    khata_no: '67',
    khesra_no: '154',
    area_decimal: 5.25,
    deed_no: '1102/2026',
    deed_date: '2026-05-01',
    received_on: '2026-05-06',
    current_step: 'SCRUTINY',
    status: 'IN_PROGRESS',
    deed_text: `दानकर्ता: जगदीश तिवारी, पिता- स्व० केदार तिवारी
दानग्रहीता: शारदा देवी (पुत्री), पति- आलोक चौबे
मौजा: बहादुरपुर, अंचल- डेमो अंचल
खाता: 67, खेसरा: 154, रकबा: 5.25 डिसमिल दान स्वरूप प्रदत्त।
दस्तावेज संख्या: 1102/2026, निबंधन तिथि: 01-05-2026
चौहद्दी: उत्तर- बागीचा, दक्षिण- रास्ता, पूरब- जगदीश तिवारी, पश्चिम- देवेन्द्र।
पुत्री के प्रति स्नेहवश उक्त जमीन का दान पत्र निष्पादित किया गया।`,
  },
  // 5. FIELD_ENQUIRY - Overdue
  {
    case_no: 'DK-2026-0005',
    applicant_name: 'संतोष यादव',
    applicant_phone: '9876500005',
    transaction_type: 'SALE',
    mauza: 'फतेहपुर',
    khata_no: '23',
    khesra_no: '99',
    area_decimal: 18.0,
    deed_no: '334/2026',
    deed_date: '2026-01-20',
    received_on: '2026-01-25',
    current_step: 'FIELD_ENQUIRY',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: हरिनंदन यादव, पिता- बिहारी यादव
क्रेता: संतोष यादव, पिता- मुनीलाल यादव
मौजा: फतेहपुर, अंचल- डेमो अंचल
खाता संख्या: 23, खेसरा संख्या: 99, रकबा: 18 डिसमिल
दस्तावेज संख्या: 334/2026, दिनांक: 20-01-2026
चौहद्दी: उत्तर- बाँसवाड़ी, दक्षिण- पक्की नाली, पूरब- महेन्द्र यादव, पश्चिम- रास्ता।
क्रेता का खेत पर जोत-कोड़ कब्जा बहाल है।`,
  },
  // 6. FIELD_ENQUIRY - Tricky Case C: Two co-sharers mentioned in deed
  {
    case_no: 'DK-2026-0006',
    applicant_name: 'अशोक कुमार झा',
    applicant_phone: '9876500006',
    transaction_type: 'SALE',
    mauza: 'मधुबन',
    khata_no: '105',
    khesra_no: '210',
    area_decimal: 10.0,
    deed_no: '772/2026',
    deed_date: '2026-04-05',
    received_on: '2026-04-15',
    current_step: 'FIELD_ENQUIRY',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: प्रभात मिश्र, पिता- स्व० अमरनाथ मिश्र
क्रेता: अशोक कुमार झा, पिता- तारानंद झा
मौजा: मधुबन, अंचल- डेमो अंचल
खाता संख्या: 105, खेसरा: 210, रकबा: 10 डिसमिल
दस्तावेज संख्या: 772/2026, निबंधन तिथि: 05-04-2026
नोट: उक्त भूमि विक्रेता एवं सह-हिस्सेदार विनय मिश्र व संजय मिश्र के संयुक्त हिस्से की है।
चौहद्दी: उत्तर- विनय मिश्र, दक्षिण- संजय मिश्र, पूरब- मुख्य मार्ग, पश्चिम- पोखर।`,
  },
  // 7. FIELD_ENQUIRY - Tricky Case E: Field notes mention boundary dispute
  {
    case_no: 'DK-2026-0007',
    applicant_name: 'सुरेन्द्र महतो',
    applicant_phone: '9876500007',
    transaction_type: 'SALE',
    mauza: 'हरिहरपुर',
    khata_no: '34',
    khesra_no: '180',
    area_decimal: 6.5,
    deed_no: '915/2026',
    deed_date: '2026-04-20',
    received_on: '2026-04-28',
    current_step: 'FIELD_ENQUIRY',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: किशोरी लाल, पिता- रूपनारायण लाल
क्रेता: सुरेन्द्र महतो, पिता- भुनेश्वर महतो
मौजा: हरिहरपुर, अंचल- डेमो अंचल
खाता: 34, खेसरा संख्या: 180, रकबा: 6.5 डिसमिल
दस्तावेज: 915/2026, दिनांक: 20-04-2026
चौहद्दी: उत्तर- बाउंड्री वाल, दक्षिण- धर्मेन्द्र कुमार, पूरब- गली, पश्चिम- खेत।
विक्रेता द्वारा पूर्ण हक-हकूक क्रेता को अंतरित।`,
  },
  // 8. NOTICE_OBJECTION - Overdue
  {
    case_no: 'DK-2026-0008',
    applicant_name: 'गीता देवी',
    applicant_phone: '9876500008',
    transaction_type: 'SALE',
    mauza: 'शीतलपुर',
    khata_no: '56',
    khesra_no: '340',
    area_decimal: 7.75,
    deed_no: '401/2026',
    deed_date: '2026-01-28',
    received_on: '2026-02-02',
    current_step: 'NOTICE_OBJECTION',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: मनोज साह, पिता- बैजनाथ साह
क्रेता: गीता देवी, पति- सत्यनारायण साह
मौजा: शीतलपुर, अंचल- डेमो अंचल
खाता: 56, खेसरा: 340, रकबा: 7.75 डिसमिल
दस्तावेज संख्या: 401/2026, निबंधन तिथि: 28-01-2026
चौहद्दी: उत्तर- विनोद साह, दक्षिण- रास्ता, पूरब- रामजी साह, पश्चिम- स्कूल।
क्रेता शांतिपूर्ण रूप से काबिज दखिल हैं।`,
  },
  // 9. NOTICE_OBJECTION - Tricky Case D: Inheritance with heir abroad
  {
    case_no: 'DK-2026-0009',
    applicant_name: 'अनिरुद्ध वर्मा',
    applicant_phone: '9876500009',
    transaction_type: 'INHERITANCE',
    mauza: 'केशोपुर',
    khata_no: '19',
    khesra_no: '82',
    area_decimal: 25.0,
    deed_no: 'वारिसनामा/2026',
    deed_date: '2026-03-15',
    received_on: '2026-04-05',
    current_step: 'NOTICE_OBJECTION',
    status: 'IN_PROGRESS',
    deed_text: `मृतक जमाबंदी रैयत: स्व० सत्येन्द्र नारायण वर्मा
वारिसान आवेदक: अनिरुद्ध वर्मा (पुत्र)
अन्य वारिस: सुधीर वर्मा (पुत्र - वर्तमान में विदेश में निवासरत), मीरा देवी (विवाहिता पुत्री)
मौजा: केशोपुर, अंचल- डेमो अंचल
खाता संख्या: 19, खेसरा संख्या: 82, कुल पैतृक रकबा: 25.0 डिसमिल
चौहद्दी: उत्तर- नहर, दक्षिण- पक्की सड़क, पूरब- राधेश्याम, पश्चिम- पंचायत भवन।
मृत्यु उपरांत वंशावली के आधार पर संयुक्त नामान्तरण हेतु आवेदन।`,
  },
  // 10. NOTICE_OBJECTION - Returned history (Returned once to field enquiry then forwarded back)
  {
    case_no: 'DK-2026-0010',
    applicant_name: 'प्रमोद कुमार',
    applicant_phone: '9876500010',
    transaction_type: 'SALE',
    mauza: 'नवादा',
    khata_no: '72',
    khesra_no: '195',
    area_decimal: 11.2,
    deed_no: '630/2026',
    deed_date: '2026-03-20',
    received_on: '2026-03-28',
    current_step: 'NOTICE_OBJECTION',
    status: 'IN_PROGRESS',
    hasReturnedHistory: true,
    deed_text: `विक्रेता: रामेश्वर महतो, पिता- शिवजी महतो
क्रेता: प्रमोद कुमार, पिता- रामनारायण राय
मौजा: नवादा, अंचल- डेमो अंचल
खाता: 72, खेसरा: 195, रकबा: 11.2 डिसमिल
दस्तावेज संख्या: 630/2026, दिनांक: 20-03-2026
चौहद्दी: उत्तर- सीताराम, दक्षिण- कच्ची सड़क, पूरब- निज क्रेता, पश्चिम- रामलगन।
बिक्रित भूमि पर किसी अन्य का स्वत्व या दावा नहीं है।`,
  },
  // 11. HEARING_RECOMMENDATION - Due Soon
  {
    case_no: 'DK-2026-0011',
    applicant_name: 'अखिलेश कुमार चौबे',
    applicant_phone: '9876500011',
    transaction_type: 'SALE',
    mauza: 'बेलछी',
    khata_no: '41',
    khesra_no: '163',
    area_decimal: 9.0,
    deed_no: '840/2026',
    deed_date: '2026-03-25',
    received_on: '2026-04-01',
    current_step: 'HEARING_RECOMMENDATION',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: रामाधार चौबे, पिता- स्व० विश्वनाथ चौबे
क्रेता: अखिलेश कुमार चौबे, पिता- रामप्रवेश चौबे
मौजा: बेलछी, अंचल- डेमो अंचल
खाता: 41, खेसरा: 163, रकबा: 9.0 डिसमिल
दस्तावेज: 840/2026, निबंधन तिथि: 25-03-2026
चौहद्दी: उत्तर- रास्ता, दक्षिण- खेत रामाधार, पूरब- त्रिभुवन, पश्चिम- रामनाथ।
दखल कब्जा क्रेता का मौके पर पाया गया।`,
  },
  // 12. HEARING_RECOMMENDATION - On Track
  {
    case_no: 'DK-2026-0012',
    applicant_name: 'कौशल्या देवी',
    applicant_phone: '9876500012',
    transaction_type: 'SALE',
    mauza: 'शाहपुर',
    khata_no: '93',
    khesra_no: '411',
    area_decimal: 14.8,
    deed_no: '955/2026',
    deed_date: '2026-04-08',
    received_on: '2026-04-16',
    current_step: 'HEARING_RECOMMENDATION',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: सुधीर पासवान, पिता- स्व० बिकाऊ पासवान
क्रेता: कौशल्या देवी, पति- भरत प्रसाद
मौजा: शाहपुर, अंचल- डेमो अंचल
खाता: 93, खेसरा: 411, रकबा: 14.8 डिसमिल
दस्तावेज संख्या: 955/2026, दिनांक: 08-04-2026
चौहद्दी: उत्तर- नहर बांध, दक्षिण- श्यामा देवी, पूरब- सड़क, पश्चिम- खेत।
दस्तावेज वैध एवं निर्विवाद है।`,
  },
  // 13. FINAL_ORDER - In Progress (Due Soon)
  {
    case_no: 'DK-2026-0013',
    applicant_name: 'सत्येन्द्र कुमार मिश्र',
    applicant_phone: '9876500013',
    transaction_type: 'SALE',
    mauza: 'मझौलिया',
    khata_no: '31',
    khesra_no: '127',
    area_decimal: 16.0,
    deed_no: '710/2026',
    deed_date: '2026-03-10',
    received_on: '2026-03-16',
    current_step: 'FINAL_ORDER',
    status: 'IN_PROGRESS',
    deed_text: `विक्रेता: ब्रजनंदन मिश्र, पिता- स्व० देवनंदन मिश्र
क्रेता: सत्येन्द्र कुमार मिश्र, पिता- स्व० उमाकांत मिश्र
मौजा: मझौलिया, अंचल- डेमो अंचल
खाता संख्या: 31, खेसरा: 127, रकबा: 16.0 डिसमिल
दस्तावेज: 710/2026, निबंधन तिथि: 10-03-2026
चौहद्दी: उत्तर- बागीचा, दक्षिण- मुख्य सड़क, पूरब- ब्रजनंदन मिश्र, पश्चिम- पोखर।
समस्त प्रक्रियाएं पूर्ण, अंतिम आदेश हेतु प्रस्तुत।`,
  },
  // 14. FINAL_ORDER - APPROVED
  {
    case_no: 'DK-2026-0014',
    applicant_name: 'उमेश नारायण सिंह',
    applicant_phone: '9876500014',
    transaction_type: 'SALE',
    mauza: 'मनिहारी',
    khata_no: '15',
    khesra_no: '89',
    area_decimal: 20.0,
    deed_no: '302/2026',
    deed_date: '2026-01-05',
    received_on: '2026-01-12',
    current_step: 'FINAL_ORDER',
    status: 'APPROVED',
    deed_text: `विक्रेता: त्रिलोकी नाथ सिंह, पिता- स्व० महेश्वर सिंह
क्रेता: उमेश नारायण सिंह, पिता- स्व० कामेश्वर सिंह
मौजा: मनिहारी, अंचल- डेमो अंचल
खाता: 15, खेसरा: 89, रकबा: 20.0 डिसमिल
दस्तावेज: 302/2026, दिनांक: 05-01-2026
चौहद्दी: उत्तर- पक्की सड़क, दक्षिण- नहर, पूरब- सुरेश सिंह, पश्चिम- मदन मोहन।
आदेशानुसार शुद्धि पत्र जारी किया गया एवं जमाबंदी कायम हुई।`,
  },
  // 15. SCRUTINY - REJECTED
  {
    case_no: 'DK-2026-0015',
    applicant_name: 'मुन्ना अंसारी',
    applicant_phone: '9876500015',
    transaction_type: 'SALE',
    mauza: 'सिकंदरपुर',
    khata_no: '9',
    khesra_no: '44',
    area_decimal: 4.5,
    deed_no: '188/2026',
    deed_date: '2026-02-14',
    received_on: '2026-02-20',
    current_step: 'SCRUTINY',
    status: 'REJECTED',
    deed_text: `विक्रेता: जमालुद्दीन, पिता- स्व० सलामुद्दीन
क्रेता: मुन्ना अंसारी, पिता- कलीमुद्दीन अंसारी
मौजा: सिकंदरपुर, अंचल- डेमो अंचल
खाता: 9, खेसरा: 44, रकबा: 4.5 डिसमिल
दस्तावेज संख्या: 188/2026, दिनांक: 14-02-2026
चौहद्दी: उत्तर- सरकारी नाला, दक्षिण- रास्ता, पूरब- असलम, पश्चिम- मस्जिद वक्फ भूमि।
वक्फ भूमि की सीमा से सटी विवादित भूमि होने तथा विक्रेता का हक स्पष्ट न होने से खारिज।`,
  },
];

async function seed() {
  console.log('--- Seeding Dakhil-Kharij Sahayak Database ---');

  // 1. Create or reuse demo users in Supabase Auth and Profiles
  const userIds: Record<Role, string> = {
    halka_karamchari: '',
    revenue_officer: '',
    circle_officer: '',
  };

  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error('Error fetching auth users:', listError.message);
    process.exit(1);
  }

  for (const demoUser of DEMO_USERS) {
    const existing = listData?.users?.find((u) => u.email === demoUser.email);
    let uid = existing?.id;

    if (!uid) {
      console.log(`Creating auth user: ${demoUser.email}...`);
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: demoUser.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
      });

      if (createError || !newUser?.user) {
        console.error(`Failed to create ${demoUser.email}:`, createError?.message);
        process.exit(1);
      }
      uid = newUser.user.id;
    } else {
      console.log(`Reusing existing auth user: ${demoUser.email} (${uid})`);
    }

    userIds[demoUser.role] = uid;

    // Upsert profile
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: uid,
      full_name: demoUser.name,
      role: demoUser.role,
      anchal: 'डेमो अंचल',
    });

    if (profileError) {
      console.error(`Failed to upsert profile for ${demoUser.name}:`, profileError.message);
      process.exit(1);
    }
  }

  console.log('✓ Profiles verified for all 3 demo users.');

  // 2. Wipe old demo applications via truncate_demo_data RPC
  const { error: rpcErr } = await adminClient.rpc('truncate_demo_data');
  if (rpcErr) {
    console.error(
      '\n[ERROR] Failed to wipe demo data: could not execute RPC function public.truncate_demo_data().'
    );
    console.error(
      'Please run supabase/migrations/0003_demo_reset.sql in your Supabase SQL Editor first.\nError details:',
      rpcErr.message
    );
    process.exit(1);
  }
  console.log('✓ Successfully wiped old demo applications via truncate_demo_data RPC.');

  // 3. Insert 15 synthetic applications
  console.log('Inserting 15 synthetic applications...');
  for (const app of SEED_APPLICATIONS) {
    const dueOn = dueDate(app.received_on, slaDays);

    const { data: insertedApp, error: appError } = await adminClient
      .from('applications')
      .upsert(
        {
          case_no: app.case_no,
          applicant_name: app.applicant_name,
          applicant_phone: app.applicant_phone,
          transaction_type: app.transaction_type,
          mauza: app.mauza,
          khata_no: app.khata_no,
          khesra_no: app.khesra_no,
          area_decimal: app.area_decimal,
          deed_no: app.deed_no,
          deed_date: app.deed_date,
          deed_text: app.deed_text,
          received_on: app.received_on,
          due_on: dueOn,
          current_step: app.current_step,
          status: app.status,
        },
        { onConflict: 'case_no' }
      )
      .select('id')
      .single();

    if (appError || !insertedApp) {
      console.error(`Failed to insert application ${app.case_no}:`, appError?.message);
      continue;
    }

    const appId = insertedApp.id;

    // Insert initial CREATED audit event if not present
    await adminClient.from('audit_events').insert({
      application_id: appId,
      actor_id: userIds.revenue_officer,
      actor_role: 'revenue_officer',
      event_type: 'CREATED',
      from_step: 'SCRUTINY',
      to_step: 'SCRUTINY',
      note: 'आवेदन ऑनलाइन पोर्टल से प्राप्त हुआ। जाँच हेतु दर्ज।',
      created_at: `${app.received_on}T10:00:00Z`,
    });

    // 4. If application has progressed beyond SCRUTINY, populate step_records & audit_events
    if (app.current_step !== 'SCRUTINY' || app.status === 'REJECTED') {
      // Scrutiny completed
      await adminClient.from('step_records').upsert(
        {
          application_id: appId,
          step: 'SCRUTINY',
          data: {
            documentsComplete: true,
            mismatchNotes: 'दस्तावेज एवं खतियान का मिलान सही पाया गया।',
            officerRemarks: 'स्थल निरीक्षण हेतु कर्मचारी को अग्रसारित।',
          },
          updated_by: userIds.revenue_officer,
          updated_at: addWorkingDays(app.received_on, 2) + 'T11:00:00Z',
        },
        { onConflict: 'application_id,step' }
      );

      if (app.status === 'REJECTED') {
        await adminClient.from('audit_events').insert({
          application_id: appId,
          actor_id: userIds.revenue_officer,
          actor_role: 'revenue_officer',
          event_type: 'REJECTED',
          from_step: 'SCRUTINY',
          to_step: 'SCRUTINY',
          note: 'सीमा विवाद एवं वक्फ भूमि संलग्नता के कारण प्रथम दृष्टया अस्वीकृत।',
          created_at: addWorkingDays(app.received_on, 3) + 'T14:00:00Z',
        });
      } else {
        await adminClient.from('audit_events').insert({
          application_id: appId,
          actor_id: userIds.revenue_officer,
          actor_role: 'revenue_officer',
          event_type: 'FORWARDED',
          from_step: 'SCRUTINY',
          to_step: 'FIELD_ENQUIRY',
          note: 'प्रथम दृष्टया कागजात सही। स्थल निरीक्षण हेतु प्रेषित।',
          created_at: addWorkingDays(app.received_on, 2) + 'T11:00:00Z',
        });
      }
    }

    // Past FIELD_ENQUIRY
    const pastFieldEnquiry = [
      'NOTICE_OBJECTION',
      'HEARING_RECOMMENDATION',
      'FINAL_ORDER',
    ].includes(app.current_step);

    if (pastFieldEnquiry) {
      // Check if this case had a return history
      if (app.hasReturnedHistory) {
        await adminClient.from('audit_events').insert({
          application_id: appId,
          actor_id: userIds.halka_karamchari,
          actor_role: 'halka_karamchari',
          event_type: 'FORWARDED',
          from_step: 'FIELD_ENQUIRY',
          to_step: 'NOTICE_OBJECTION',
          note: 'प्रारंभिक स्थल जांच प्रतिवेदन भेजा गया।',
          created_at: addWorkingDays(app.received_on, 6) + 'T12:00:00Z',
        });
        await adminClient.from('audit_events').insert({
          application_id: appId,
          actor_id: userIds.revenue_officer,
          actor_role: 'revenue_officer',
          event_type: 'RETURNED',
          from_step: 'NOTICE_OBJECTION',
          to_step: 'FIELD_ENQUIRY',
          note: 'चौहद्दी में पड़ोसी का नाम स्पष्ट नहीं है। पुनः सत्यापन करें।',
          created_at: addWorkingDays(app.received_on, 8) + 'T15:00:00Z',
        });
      }

      await adminClient.from('step_records').upsert(
        {
          application_id: appId,
          step: 'FIELD_ENQUIRY',
          data: {
            visitDate: addWorkingDays(app.received_on, 10),
            possessionStatus: 'BUYER',
            coSharersPresent: true,
            boundaryDispute: false,
            roughNotes: 'मौके पर खरीदार का शांतिपूर्ण दखल कब्जा पाया गया।',
            reportText:
              'स्थल निरीक्षण में पाया गया कि आवेदक का उक्त रकबे पर शांतिपूर्ण कब्जा है। किसी प्रकार का विवाद नहीं मिला।',
          },
          updated_by: userIds.halka_karamchari,
          updated_at: addWorkingDays(app.received_on, 10) + 'T16:00:00Z',
        },
        { onConflict: 'application_id,step' }
      );

      await adminClient.from('audit_events').insert({
        application_id: appId,
        actor_id: userIds.halka_karamchari,
        actor_role: 'halka_karamchari',
        event_type: 'FORWARDED',
        from_step: 'FIELD_ENQUIRY',
        to_step: 'NOTICE_OBJECTION',
        note: 'स्थल जांच संपन्न, दखल कब्जा सही पाया गया। अग्रसारित।',
        created_at: addWorkingDays(app.received_on, 10) + 'T16:00:00Z',
      });
    }

    // Past NOTICE_OBJECTION
    const pastNotice = ['HEARING_RECOMMENDATION', 'FINAL_ORDER'].includes(app.current_step);
    if (pastNotice) {
      await adminClient.from('step_records').upsert(
        {
          application_id: appId,
          step: 'NOTICE_OBJECTION',
          data: {
            generalNoticeIssuedOn: addWorkingDays(app.received_on, 11),
            objectionDeadline: addWorkingDays(app.received_on, 25),
            specificNoticeParties: [{ name: 'विक्रेता एवं हितबद्ध व्यक्ति', relation: 'संबद्ध' }],
            objections: [],
          },
          updated_by: userIds.revenue_officer,
          updated_at: addWorkingDays(app.received_on, 26) + 'T10:30:00Z',
        },
        { onConflict: 'application_id,step' }
      );

      await adminClient.from('audit_events').insert({
        application_id: appId,
        actor_id: userIds.revenue_officer,
        actor_role: 'revenue_officer',
        event_type: 'FORWARDED',
        from_step: 'NOTICE_OBJECTION',
        to_step: 'HEARING_RECOMMENDATION',
        note: 'आम व खास सूचना निर्गत, मियाद अंदर कोई आपत्ति प्राप्त नहीं हुई।',
        created_at: addWorkingDays(app.received_on, 26) + 'T10:30:00Z',
      });
    }

    // Past HEARING_RECOMMENDATION
    if (app.current_step === 'FINAL_ORDER') {
      await adminClient.from('step_records').upsert(
        {
          application_id: appId,
          step: 'HEARING_RECOMMENDATION',
          data: {
            hearingDate: addWorkingDays(app.received_on, 27),
            summaryText: 'सुनवाई में पक्षकार उपस्थित, कोई आपत्ति नहीं।',
            recommendationText: 'सभी जांच व साक्ष्य संतोषजनक हैं। दाखिल खारिज की अनुशंसा की जाती है।',
          },
          updated_by: userIds.revenue_officer,
          updated_at: addWorkingDays(app.received_on, 27) + 'T15:00:00Z',
        },
        { onConflict: 'application_id,step' }
      );

      await adminClient.from('audit_events').insert({
        application_id: appId,
        actor_id: userIds.revenue_officer,
        actor_role: 'revenue_officer',
        event_type: 'FORWARDED',
        from_step: 'HEARING_RECOMMENDATION',
        to_step: 'FINAL_ORDER',
        note: 'दाखिल खारिज हेतु स्पष्ट अनुशंसा सहित अंचलाधिकारी के समक्ष प्रस्तुत।',
        created_at: addWorkingDays(app.received_on, 27) + 'T15:00:00Z',
      });

      if (app.status === 'APPROVED') {
        await adminClient.from('step_records').upsert(
          {
            application_id: appId,
            step: 'FINAL_ORDER',
            data: {
              orderText: 'राजस्व अधिकारी की अनुशंसा स्वीकार की जाती है। दाखिल खारिज स्वीकृत किया जाता है।',
            },
            updated_by: userIds.circle_officer,
            updated_at: addWorkingDays(app.received_on, 29) + 'T16:30:00Z',
          },
          { onConflict: 'application_id,step' }
        );

        await adminClient.from('audit_events').insert({
          application_id: appId,
          actor_id: userIds.circle_officer,
          actor_role: 'circle_officer',
          event_type: 'APPROVED',
          from_step: 'FINAL_ORDER',
          to_step: 'FINAL_ORDER',
          note: 'दाखिल खारिज स्वीकृत। शुद्धि पत्र जारी किया जाए।',
          created_at: addWorkingDays(app.received_on, 29) + 'T16:30:00Z',
        });
      }
    }
  }

  // Summary counts
  const { count: profileCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true });
  const { count: appCount } = await adminClient.from('applications').select('*', { count: 'exact', head: true });

  console.log('\n--- Seed Summary ---');
  console.log(`Profiles in database: ${profileCount} (expected 3)`);
  console.log(`Applications in database: ${appCount} (expected 15)`);
  console.log('✓ Seeding complete.');
}

seed().catch((err) => {
  console.error('Seed script error:', err);
  process.exit(1);
});

