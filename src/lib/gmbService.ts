import axios from 'axios';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const MOCK_GMB_API = process.env.MOCK_GMB_API === 'true';

export interface GMBPostResponse {
  name: string; // The post resource name from Google
  searchUrl: string;
  mediaUrl?: string;
  summary: string;
}

/**
 * Exchanges a GMB client refresh token for a new temporary Access Token
 */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  if (MOCK_GMB_API) {
    console.log('GMB API (MOCK): Refreshing access token via refresh token...');
    return 'mock-google-access-token-12345';
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth Client ID or Client Secret is missing in env.local');
  }

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return response.data.access_token;
  } catch (err: any) {
    console.error('Failed to refresh Google OAuth access token:', err.response?.data || err.message);
    throw new Error(`Google token refresh failed: ${err.message}`);
  }
}

const VALID_GCIDS = new Set([
  'categories/gcid:training_center',
  'categories/gcid:educational_institution',
  'categories/gcid:software_training_institute',
  'categories/gcid:vocational_school',
  'categories/gcid:school',
  'categories/gcid:english_language_school',
  'categories/gcid:learning_center',
  'categories/gcid:career_development_center',
  'categories/gcid:tutoring_service',
  'categories/gcid:coaching_center',
  'categories/gcid:computer_training_school',
  'categories/gcid:education_center',
  'categories/gcid:primary_school',
  'categories/gcid:high_school',
  'categories/gcid:private_school',
]);

function cleanGmbCategory(catName: string): string {
  if (!catName) return '';
  
  if (catName.startsWith('categories/gcid:')) {
    return catName;
  }
  
  let clean = catName.replace(/^categories\//, '').replace(/^gcid:/, '');
  
  const nameMap: Record<string, string> = {
    'training institute': 'training_center',
    'training centre': 'training_center',
    'ai training institute': 'training_center',
    'software training institute': 'software_training_institute',
    'educational institution': 'educational_institution',
    'vocational school': 'vocational_school',
    'career development center': 'career_development_center',
    'career guidance service': 'career_development_center',
    'computer training school': 'computer_training_school',
    'learning center': 'learning_center',
    'coaching center': 'coaching_center',
  };

  const normalized = clean.trim().toLowerCase();
  const matchedSuffix = nameMap[normalized] || normalized.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  
  let finalSuffix = matchedSuffix;
  if (finalSuffix === 'training_centre') finalSuffix = 'training_center';
  if (finalSuffix === 'learning_centre') finalSuffix = 'learning_center';
  if (finalSuffix === 'coaching_centre') finalSuffix = 'coaching_center';
  
  return `categories/gcid:${finalSuffix}`;
}

/**
 * Formats a phone number to standard E.164 format (+[country_code][number])
 */
export function formatE164Phone(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // If it's a 10-digit number, assume India (+91)
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  // If it starts with 91 and has 12 digits (e.g. 91xxxxxxxxxx)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  // Default fallback if we can't reliably guess: prepend +
  return `+${cleaned}`;
}

/**
 * Pushes optimized categories and business description to Google Business Profile API
 */
export async function pushMetadataToGMB(
  locationId: string,
  accessToken: string,
  primaryCategory: string,
  secondaryCategories: string[],
  description: string,
  primaryPhone?: string,
  websiteUri?: string
): Promise<boolean> {
  // Format primary category and fall back to standard training center if invalid
  let cleanedPrimary = cleanGmbCategory(primaryCategory);
  if (!VALID_GCIDS.has(cleanedPrimary)) {
    console.log(`Primary category "${primaryCategory}" is not in whitelist. Defaulting to training center.`);
    cleanedPrimary = 'categories/gcid:training_center';
  }

  // Format secondary categories and filter out invalid ones to prevent 400 API crashes
  const cleanedSecondaries = secondaryCategories
    .map(cat => cleanGmbCategory(cat))
    .filter(cat => VALID_GCIDS.has(cat));

  const formattedPhone = primaryPhone ? formatE164Phone(primaryPhone) : undefined;

  const gmbPayload: any = {
    title: undefined, // Do not modify title
    profile: {
      description: description
    },
    categories: {
      primaryCategory: {
        name: cleanedPrimary
      },
      additionalCategories: cleanedSecondaries.map((cat) => ({
        name: cat
      }))
    }
  };

  if (formattedPhone) {
    gmbPayload.phoneNumbers = {
      primaryPhone: formattedPhone
    };
  }
  if (websiteUri) {
    gmbPayload.websiteUri = websiteUri;
  }

  if (MOCK_GMB_API) {
    console.log('========================================================');
    console.log(`GMB API (MOCK): Pushing SEO Metadata to location "${locationId}"`);
    console.log('PAYLOAD SENT TO GOOGLE:', JSON.stringify(gmbPayload, null, 2));
    console.log('========================================================');
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }

  try {
    // Attempt 1: Try to update description, categories, phone, and website
    let mask = 'profile.description,categories';
    if (formattedPhone) mask += ',phoneNumbers';
    if (websiteUri) mask += ',websiteUri';

    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?updateMask=${mask}`;
    
    await axios.patch(url, gmbPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return true;
  } catch (err: any) {
    console.warn(`GMB full metadata patch failed:`, JSON.stringify(err.response?.data || err.message, null, 2));
    
    try {
      // Attempt 2 (Fallback): Update description, phone, website (skip categories)
      let fallbackMask = 'profile.description';
      const fallbackPayload: any = {
        profile: {
          description: description
        }
      };

      if (formattedPhone) {
        fallbackPayload.phoneNumbers = {
          primaryPhone: formattedPhone
        };
        fallbackMask += ',phoneNumbers';
      }
      if (websiteUri) {
        fallbackPayload.websiteUri = websiteUri;
        fallbackMask += ',websiteUri';
      }

      const fallbackUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?updateMask=${fallbackMask}`;
      
      await axios.patch(fallbackUrl, fallbackPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Successfully synced business description/contact info to GMB (categories update skipped).`);
      return true;
    } catch (fallbackErr: any) {
      console.warn(`GMB fallback description-phone-website patch failed:`, JSON.stringify(fallbackErr.response?.data || fallbackErr.message, null, 2));

      try {
        // Attempt 3: Update description and website only (skip phone number if throttled)
        let fallbackMask = 'profile.description';
        const fallbackPayload: any = {
          profile: {
            description: description
          }
        };

        if (websiteUri) {
          fallbackPayload.websiteUri = websiteUri;
          fallbackMask += ',websiteUri';
        }

        const fallbackUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?updateMask=${fallbackMask}`;
        
        await axios.patch(fallbackUrl, fallbackPayload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Successfully synced description and website URL (categories & phone updates skipped due to API throttling).`);
        return true;
      } catch (fallbackErr3: any) {
        console.warn(`GMB fallback description-website patch failed:`, JSON.stringify(fallbackErr3.response?.data || fallbackErr3.message, null, 2));

        try {
          // Attempt 4: Update description only (absolute fallback)
          const fallbackUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?updateMask=profile.description`;
          const fallbackPayload = {
            profile: {
              description: description
            }
          };

          await axios.patch(fallbackUrl, fallbackPayload, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`Successfully synced business description only (all other fields skipped).`);
          return true;
        } catch (fallbackErr4: any) {
          console.error(`GMB fallback description-only patch failed:`, JSON.stringify(fallbackErr4.response?.data || fallbackErr4.message, null, 2));
          throw new Error(`GMB metadata push failed: ${fallbackErr4.message}`);
        }
      }
    }
  }
}

/**
 * Pushes/configures the structured serviceList for a Google Business Profile location
 */
export async function pushServiceListToGMB(
  locationId: string,
  accessToken: string,
  services: string[],
  primaryCategory: string
): Promise<boolean> {
  if (MOCK_GMB_API) {
    console.log(`GMB API (MOCK): Configuring serviceList for location "${locationId}" with primaryCategory: "${primaryCategory}"`);
    console.log('Services Pushed:', services);
    return true;
  }

  try {
    const resolvedAccountId = await resolveGMBAccountId(locationId, accessToken);
    const url = `https://mybusiness.googleapis.com/v4/accounts/${resolvedAccountId}/locations/${locationId}/serviceList`;

    const cleanedPrimary = cleanGmbCategory(primaryCategory);

    const servicePayload = {
      name: `accounts/${resolvedAccountId}/locations/${locationId}/serviceList`,
      serviceTypes: [
        {
          displayName: primaryCategory.replace('categories/gcid:', '').replace(/_/g, ' '),
          categoryId: cleanedPrimary,
          freeFormServiceItems: services.map(srv => ({
            label: srv.trim()
          }))
        }
      ]
    };

    await axios.patch(url, servicePayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Successfully synced ${services.length} services to Google Business Profile for location "${locationId}".`);
    return true;
  } catch (err: any) {
    console.error(`Failed to push serviceList for location "${locationId}":`, err.response?.data || err.message);
    return false;
  }
}

/**
 * Dynamically resolves the correct Account ID owning a location to prevent 404/403 errors on Location Groups
 */
export async function resolveGMBAccountId(locationId: string, accessToken: string): Promise<string> {
  if (MOCK_GMB_API) return '~';
  
  try {
    const accountsUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts';
    const accountsResponse = await axios.get(accountsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const accounts = accountsResponse.data.accounts || [];
    
    for (const acc of accounts) {
      const rawAccountId = acc.name.split('/')[1]; // e.g. "106801970455480716360"
      try {
        const locationsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name`;
        const locationsResponse = await axios.get(locationsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const locations = locationsResponse.data.locations || [];
        const hasLocation = locations.some((loc: any) => loc.name === `locations/${locationId}`);
        
        if (hasLocation) {
          console.log(`Successfully mapped location "${locationId}" to Google Account ID "${rawAccountId}".`);
          return rawAccountId;
        }
      } catch (locErr: any) {
        console.warn(`Failed to inspect locations for account "${acc.name}":`, locErr.message);
      }
    }
  } catch (accErr: any) {
    console.warn(`Dynamic account discovery failed: ${accErr.message}. Defaulting to personal shorthand "~".`);
  }
  
  return '~';
}

/**
 * Publishes a new weekly post update to Google Business Profile API
 */
export async function publishPostToGMB(
  locationId: string,
  accessToken: string,
  text: string,
  mediaUrl?: string,
  ctaType: 'BOOK' | 'LEARN_MORE' | 'ORDER' | 'NONE' = 'LEARN_MORE'
): Promise<GMBPostResponse> {
  const postPayload: any = {
    summary: text,
    topicType: 'STANDARD'
  };

  if (ctaType !== 'NONE') {
    postPayload.callToAction = {
      actionType: ctaType,
      url: `https://maps.google.com/?cid=${locationId}` // Point the CTA button to their local map listing
    };
  }

  if (mediaUrl) {
    postPayload.media = [
      {
        mediaFormat: 'PHOTO',
        sourceUrl: mediaUrl
      }
    ];
  }

  if (MOCK_GMB_API) {
    console.log('========================================================');
    console.log(`GMB API (MOCK): Publishing standard update to location "${locationId}"`);
    console.log('PAYLOAD SENT TO GOOGLE:', JSON.stringify(postPayload, null, 2));
    console.log('========================================================');
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockPostId = `localPosts/mock-post-uuid-${Math.floor(Math.random() * 100000)}`;
    return {
      name: `locations/${locationId}/${mockPostId}`,
      searchUrl: `https://www.google.com/search?q=post_id:${mockPostId}`,
      mediaUrl,
      summary: text
    };
  }

  // Dynamically resolve correct Account ID owning this location
  const resolvedAccountId = await resolveGMBAccountId(locationId, accessToken);

  try {
    // POST to Google Business Local Post API
    // Endpoint: POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts
    const url = `https://mybusiness.googleapis.com/v4/accounts/${resolvedAccountId}/locations/${locationId}/localPosts`;
    console.log(`Publishing local post using endpoint URL: ${url}`);
    
    const response = await axios.post(url, postPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      name: response.data.name,
      searchUrl: response.data.searchUrl,
      mediaUrl: response.data.media?.[0]?.googleUrl || mediaUrl,
      summary: response.data.summary
    };
  } catch (err: any) {
    console.error(`Failed to publish GMB post for location "${locationId}":`, err.response?.data || err.message);
    throw new Error(`GMB post publishing failed: ${err.message}`);
  }
}

export interface GMBReview {
  reviewId: string;
  reviewerName: string;
  comment: string;
  starRating: number; // 1 to 5
  createTime: string;
}

/**
 * Fetches recent reviews for a Google Business Profile location
 */
export async function fetchGMBReviews(
  locationId: string,
  accessToken: string
): Promise<GMBReview[]> {
  if (MOCK_GMB_API) {
    console.log(`GMB API (MOCK): Fetching reviews for location "${locationId}"`);
    // Return standard mock reviews to simulate doctor clinic feedback
    return [
      {
        reviewId: 'rev-mock-001',
        reviewerName: 'Ramesh Naidu',
        comment: 'Excellent care! The doctors are highly professional and explain everything clearly. Highly recommend this clinic for IVF treatments.',
        starRating: 5,
        createTime: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
      },
      {
        reviewId: 'rev-mock-002',
        reviewerName: 'Sneha Sharma',
        comment: 'Very long waiting times. I had to wait for 2 hours even after booking an appointment. Doctors are good but management needs to improve.',
        starRating: 2,
        createTime: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
      },
      {
        reviewId: 'rev-mock-003',
        reviewerName: 'David K.',
        comment: 'Clean facilities and friendly staff. Made me feel very comfortable throughout my procedure.',
        starRating: 4,
        createTime: new Date(Date.now() - 3600000 * 120).toISOString() // 5 days ago
      }
    ];
  }

  try {
    const resolvedAccountId = await resolveGMBAccountId(locationId, accessToken);
    // GET from GMB Reviews API
    // Endpoint: GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/${locationId}/reviews
    const url = `https://mybusiness.googleapis.com/v4/accounts/${resolvedAccountId}/locations/${locationId}/reviews`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const reviewsList = response.data.reviews || [];
    return reviewsList.map((r: any) => ({
      reviewId: r.reviewId,
      reviewerName: r.reviewer?.displayName || 'Anonymous',
      comment: r.comment || '',
      starRating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
      createTime: r.createTime
    }));
  } catch (err: any) {
    console.error(`Failed to fetch reviews for location "${locationId}":`, err.response?.data || err.message);
    throw new Error(`GMB fetch reviews failed: ${err.message}`);
  }
}

/**
 * Pushes an AI-generated reply to a customer review on Google Business Profile
 */
export async function pushGMBReviewReply(
  locationId: string,
  reviewId: string,
  accessToken: string,
  replyText: string
): Promise<boolean> {
  if (MOCK_GMB_API) {
    console.log('========================================================');
    console.log(`GMB API (MOCK): Replying to review "${reviewId}" for location "${locationId}"`);
    console.log('REPLY TEXT SENT:', replyText);
    console.log('========================================================');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }

  try {
    const resolvedAccountId = await resolveGMBAccountId(locationId, accessToken);
    // PUT to GMB Reviews Reply API
    // Endpoint: PUT https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/${locationId}/reviews/${reviewId}/reply
    const url = `https://mybusiness.googleapis.com/v4/accounts/${resolvedAccountId}/locations/${locationId}/reviews/${reviewId}/reply`;
    
    await axios.put(
      url,
      { comment: replyText },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return true;
  } catch (err: any) {
    console.error(`Failed to reply to GMB review "${reviewId}":`, err.response?.data || err.message);
    throw new Error(`GMB review reply failed: ${err.message}`);
  }
}

/**
 * Pushes a single AI-generated FAQ (Question + Answer) to Google Business Profile Q&A API
 */
export async function pushFAQToGMB(
  locationId: string,
  accessToken: string,
  questionText: string,
  answerText: string
): Promise<boolean> {
  if (MOCK_GMB_API) {
    console.log('========================================================');
    console.log(`GMB API (MOCK): Publishing FAQ to location "${locationId}"`);
    console.log('QUESTION:', questionText);
    console.log('ANSWER:', answerText);
    console.log('========================================================');
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }

  try {
    const resolvedAccountId = await resolveGMBAccountId(locationId, accessToken);
    // 1. Post the Question
    // Endpoint: POST https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/questions
    const questionUrl = `https://mybusiness.googleapis.com/v4/accounts/${resolvedAccountId}/locations/${locationId}/questions`;
    const questionResponse = await axios.post(
      questionUrl,
      {
        question: {
          text: questionText
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const questionName = questionResponse.data.name; // e.g. "accounts/{accId}/locations/{locId}/questions/{questId}"
    if (!questionName) {
      throw new Error('No question name returned from Google Q&A API.');
    }

    // 2. Post the Answer
    const answerUrl = `https://mybusiness.googleapis.com/${questionName}/answers`;
    await axios.post(
      answerUrl,
      {
        answer: {
          text: answerText
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return true;
  } catch (err: any) {
    console.error(`Failed to push FAQ to GMB location "${locationId}":`, err.response?.data || err.message);
    throw new Error(`GMB FAQ push failed: ${err.message}`);
  }
}

/**
 * Publishes a media photo to Google Business Profile location
 */
export async function publishMediaToGMB(
  locationId: string,
  accessToken: string,
  mediaUrl: string,
  category: 'ADDITIONAL' | 'LOGO' | 'COVER' | 'INTERIOR' | 'EXTERIOR' = 'ADDITIONAL'
): Promise<string> {
  if (MOCK_GMB_API) {
    console.log(`GMB API (MOCK): Uploading photo media for location "${locationId}" from URL: ${mediaUrl} (Category: ${category})`);
    return `accounts/mock_acc/locations/${locationId}/media/mock-media-${Date.now()}`;
  }

  try {
    const resolvedAccountId = await resolveGMBAccountId(locationId, accessToken);
    const url = `https://mybusiness.googleapis.com/v4/accounts/${resolvedAccountId}/locations/${locationId}/media`;
    
    const postPayload = {
      mediaFormat: 'PHOTO',
      locationAssociation: {
        category: category
      },
      sourceUrl: mediaUrl
    };

    const response = await axios.post(url, postPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.name; // e.g. "accounts/{accId}/locations/{locId}/media/{mediaId}"
  } catch (err: any) {
    console.error(`Failed to upload GMB media for location "${locationId}":`, err.response?.data || err.message);
    throw new Error(`GMB media upload failed: ${err.message}`);
  }
}
