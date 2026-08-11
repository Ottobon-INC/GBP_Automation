import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Copied exactly from gmbService.ts to reproduce the exact state
const VALID_GCIDS = new Set([
  'categories/gcid:training_center', 'categories/gcid:educational_institution', 'categories/gcid:software_training_institute',
  'categories/gcid:vocational_school', 'categories/gcid:school', 'categories/gcid:english_language_school',
  'categories/gcid:learning_center', 'categories/gcid:career_development_center', 'categories/gcid:tutoring_service',
  'categories/gcid:coaching_center', 'categories/gcid:computer_training_school', 'categories/gcid:education_center',
  'categories/gcid:primary_school', 'categories/gcid:high_school', 'categories/gcid:private_school',
  'categories/gcid:fertility_clinic', 'categories/gcid:medical_center', 'categories/gcid:maternity_hospital',
  'categories/gcid:gynecologist', 'categories/gcid:hospital', 'categories/gcid:doctor', 'categories/gcid:dentist',
  'categories/gcid:dental_clinic', 'categories/gcid:dermatologist', 'categories/gcid:skin_care_clinic',
  'categories/gcid:medical_group', 'categories/gcid:reproductive_health_clinic', 'categories/gcid:pregnancy_care_center',
  'categories/gcid:family_planning_center',
]);

function cleanGmbCategory(catName) {
  if (!catName) return '';
  if (catName.startsWith('categories/gcid:')) return catName;
  let clean = catName.replace(/^categories\//, '').replace(/^gcid:/, '');
  const nameMap = {
    'training institute': 'training_center', 'training centre': 'training_center', 'ai training institute': 'training_center',
    'software training institute': 'software_training_institute', 'educational institution': 'educational_institution',
    'vocational school': 'vocational_school', 'career development center': 'career_development_center',
    'career guidance service': 'career_development_center', 'computer training school': 'computer_training_school',
    'learning center': 'learning_center', 'coaching center': 'coaching_center', 'ivf & fertility center': 'fertility_clinic',
    'ivf and fertility center': 'fertility_clinic', 'ivf center': 'fertility_clinic', 'fertility clinic': 'fertility_clinic',
    "women's health clinic": 'gynecologist', 'womens health clinic': 'gynecologist', 'medical center': 'medical_center',
    'medical centre': 'medical_center', 'maternity hospital': 'maternity_hospital', 'maternity clinic': 'maternity_hospital',
    'gynecologist': 'gynecologist', 'fertility physician': 'fertility_clinic', 'reproductive health clinic': 'reproductive_health_clinic',
    'dentist': 'dentist', 'dental clinic': 'dental_clinic', 'dermatologist': 'dermatologist', 'skin care clinic': 'skin_care_clinic',
  };
  const normalized = clean.trim().toLowerCase();
  const matchedSuffix = nameMap[normalized] || normalized.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  let finalSuffix = matchedSuffix;
  if (finalSuffix === 'training_centre') finalSuffix = 'training_center';
  if (finalSuffix === 'learning_centre') finalSuffix = 'learning_center';
  if (finalSuffix === 'coaching_centre') finalSuffix = 'coaching_center';
  if (finalSuffix === 'medical_centre') finalSuffix = 'medical_center';
  return `categories/gcid:${finalSuffix}`;
}

function formatE164Phone(phone) {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length > 10) cleaned = cleaned.substring(1);
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return `+${cleaned}`;
}

async function testPush() {
  const clientId = '2def7b97-94a2-4a86-b03d-5929d0778acb';
  
  const { data: gbpAccount } = await supabase.from('gbp_accounts').select('*').eq('client_id', clientId).single();
  const { data: client } = await supabase.from('clients').select('*, gbp_automations(*)').eq('id', clientId).single();
  
  const primaryCategory = gbpAccount.ai_optimized_payload.recommended_categories?.primary;
  const secondaryCategories = gbpAccount.ai_optimized_payload.recommended_categories?.secondary || [];
  const description = gbpAccount.ai_optimized_payload.suggested_profile_description;

  const gbpData = Array.isArray(client.gbp_automations) ? client.gbp_automations[0] : client.gbp_automations;
  const websiteUri = gbpData?.website_url || client.onboarding_details?.website || 'https://www.example.com';
  const primaryPhone = client.contact_phone || undefined;

  let cleanedPrimary = cleanGmbCategory(primaryCategory);
  if (!VALID_GCIDS.has(cleanedPrimary)) cleanedPrimary = 'categories/gcid:medical_center';
  
  // Clean, filter, and remove duplicates/primary category
  let rawSecondaries = secondaryCategories.map(cat => cleanGmbCategory(cat)).filter(cat => VALID_GCIDS.has(cat));
  let uniqueSecondaries = [...new Set(rawSecondaries)].filter(cat => cat !== cleanedPrimary);
  const cleanedSecondaries = uniqueSecondaries;
  const formattedPhone = primaryPhone ? formatE164Phone(primaryPhone) : undefined;
  const rawLocId = gbpAccount.google_location_id.replace(/^locations\//, '');

  const gmbPayload = {
    name: `locations/${rawLocId}`,
    profile: { description: description },
    categories: { primaryCategory: { name: cleanedPrimary } }
  };
  if (cleanedSecondaries.length > 0) {
    gmbPayload.categories.additionalCategories = cleanedSecondaries.map(cat => ({ name: cat }));
  }
  if (formattedPhone) gmbPayload.phoneNumbers = { primaryPhone: formattedPhone };
  if (websiteUri) {
    gmbPayload.websiteUri = websiteUri.startsWith('http') ? websiteUri : `https://${websiteUri}`;
  }

  console.log('Sending Payload:', JSON.stringify(gmbPayload, null, 2));

  let mask = 'profile.description,categories';
  if (formattedPhone) mask += ',phoneNumbers';
  if (websiteUri) mask += ',websiteUri';

  const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: gbpAccount.refresh_token, grant_type: 'refresh_token',
  });
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${rawLocId}?updateMask=${mask}`;
  
  try {
    const response = await axios.patch(url, gmbPayload, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}`, 'Content-Type': 'application/json' }
    });
    console.log('Success:', response.data);
  } catch (err) {
    console.error('Google API Error:', JSON.stringify(err.response?.data || err.message, null, 2));
  }
}
testPush();
