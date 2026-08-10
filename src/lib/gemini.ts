import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini only if OpenAI key is not defined, prioritizing OpenAI for testing
if (GEMINI_API_KEY && !OPENAI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export interface CompetitorDataForAI {
  name: string;
  categories: string[];
  reviews: string;
}

export interface OptimizationPayload {
  gaps_identified: string[];
  recommended_categories: {
    primary: string;
    secondary: string[];
  };
  keyword_recommendations: string[];
  suggested_profile_description: string;
  weekly_posting_plan: {
    week: number;
    topic: string;
    cta: 'BOOK' | 'LEARN_MORE' | 'ORDER' | 'NONE';
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

/**
 * Feeds competitor scraper results to AI to generate structured GMB optimization ideas.
 */
export async function getSEORecommendations(
  clientName: string,
  primaryCategory: string,
  serviceArea: string,
  targetKeywords: string[],
  competitors: CompetitorDataForAI[],
  businessType: 'healthcare' | 'education' = 'healthcare'
): Promise<OptimizationPayload> {
  const competitorBlock = competitors
    .map((c, i) => {
      return `Competitor #${i + 1}:\nName: ${c.name}\nCategories: ${c.categories.join(', ')}\nReviews:\n${c.reviews}`;
    })
    .join('\n\n====================\n\n');

  const prompt = `
You are an expert Google Business Profile (GBP) Local SEO Optimizer specializing in ${
    businessType === 'healthcare' 
      ? 'medical clinics and hospital practices' 
      : 'schools, colleges, academies, and training institutes'
  }.
We have collected onboarding profile details for our client and scraped reviews of their top 3 local competitors on Google Maps.

Analyze this data, identify optimization opportunities (gaps), and output a structured JSON plan to help our client outrank these competitors.

---
CLIENT PROFILE:
Name: ${clientName}
Primary Category: ${primaryCategory}
Service Area: ${serviceArea}
Client Selected Keywords: ${targetKeywords.join(', ')}

COMPETITOR DATA SECURED:
${competitorBlock}
---

${
  businessType === 'healthcare'
    ? 'Focus optimizations on clinical services, patient-centric specialties, and HIPAA-compliant patient communication.'
    : 'Focus optimizations on courses/syllabus offered, admissions processes, college placement statistics, classroom facilities, and teacher expertise. Do NOT apply healthcare or medical restrictions.'
}

Generate recommendations matching the JSON schema below. Output ONLY valid JSON.
{
  "gaps_identified": [
    "Extract specific competitor weaknesses from reviews e.g. long waiting queues or lack of specific doctor specialists or courses. Phrase as an actionable opportunity."
  ],
  "recommended_categories": {
    "primary": "Suggest best primary category fitting the profile. CRITICAL STRICT RULE: THIS MUST BE AN EXACT, OFFICIAL GOOGLE BUSINESS CATEGORY NAME (e.g., 'Fertility clinic', 'Medical clinic', 'Hospital', 'Educational institution', 'School', 'University'). DO NOT invent or modify category names (e.g., 'IVF & Fertility Center' is invalid).",
    "secondary": ["Suggest 2 to 4 secondary categories to help rank for other search terms. CRITICAL STRICT RULE: MUST BE EXACT OFFICIAL GOOGLE CATEGORIES (e.g., 'Women\\'s health clinic')."]
  },
  "keyword_recommendations": [
    "Suggest 5 highly relevant local search keywords client should target based on competitor gaps"
  ],
  "suggested_profile_description": "Write a highly optimized 750-character profile description summarizing the clinic's strengths, services, location, and keywords.",
  "weekly_posting_plan": [
    {
      "week": 1,
      "topic": "SEO topic for Google post based on analysis",
      "cta": "BOOK"
    },
    {
      "week": 2,
      "topic": "SEO topic for Google post based on analysis",
      "cta": "LEARN_MORE"
    }
  ],
  "faqs": [
    {
      "question": "A concise search-friendly FAQ question patient/student might ask e.g. Does your IVF center accept insurance? or What are engineering admission criteria?",
      "answer": "An SEO keyword-rich response under 300 characters answering the question."
    }
  ]
}
`;

  // 1. OpenAI Fallback / Test Mode Execution
  if (OPENAI_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText) as OptimizationPayload;
    } catch (err: any) {
      console.error('OpenAI SEO recommendations failed:', err.response?.data || err.message);
      throw new Error(`OpenAI recommendations execution failed: ${err.message}`);
    }
  }

  // 2. Default Gemini Execution
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText) as OptimizationPayload;
  } catch (err: any) {
    console.error('Failed to parse Gemini output as JSON. Raw output:', responseText);
    throw new Error(`AI generated invalid JSON payload: ${err.message}`);
  }
}

/**
 * Generates a HIPAA-compliant/friendly professional reply to a customer review.
 */
export async function generateReviewReply(
  clientName: string,
  reviewerName: string,
  reviewText: string,
  starRating: number,
  businessType: 'healthcare' | 'education' = 'healthcare'
): Promise<string> {
  const prompt = `
You are an expert PR spokesperson and relations manager for "${clientName}".
Write a professional, polite response to a user's Google review.

REVIEW DETAILS:
- Reviewer Name: ${reviewerName}
- Star Rating: ${starRating} Stars
- Review Comment: "${reviewText || 'No comment provided'}"

${
  businessType === 'healthcare'
    ? `CRITICAL HEALTHCARE COMPLIANCE RULES:
1. **Never violate patient privacy (HIPAA)**: Do not confirm whether the reviewer is/was actually a patient. Do not mention any clinical terms, treatments, diagnoses, or specify any medical appointments.
2. **Keep it general and warm**: Speak generally about your dedication to providing care and clean facilities.
3. **If POSITIVE (4-5 Stars)**: Thank them warmly and appreciatively for their positive feedback, express happiness that they had a great experience, and thank them for choosing "${clientName}".
4. **If MODERATE (3 Stars)**: Write a balanced, neutral response. Thank them for the feedback, acknowledge both positive aspects and areas of improvement mentioned, and state that the clinic is always working to improve patient care.
5. **If NEGATIVE (1-2 Stars)**: Write a highly professional, polite, and apologetic response. Express general regret that their experience did not meet expectations, assure them that patient care and satisfaction is our top priority, do not validate specific medical claims, and suggest they contact the clinic manager directly offline to resolve their concerns.`
    : `EDUCATION SECTOR CUSTOMER SERVICE RULES:
1. **Be responsive and helpful**: Address the reviewer directly by name and feel free to discuss their comments, academic courses, or classes.
2. **If POSITIVE (4-5 Stars)**: Thank them warmly for their review, congratulate them on their academic journey or studies, and state that your campus/faculty is proud of their feedback.
3. **If MODERATE (3 Stars)**: Write a balanced response. Thank them for sharing their experience, acknowledge their feedback on what we do well and where we can improve, and state that we continually review our curriculum, teachers, and facilities to improve.
4. **If NEGATIVE (1-2 Stars)**: Express sincere concern and apologies. Reiterate your dedication to student success, and politely suggest they contact the Admissions, Placement, or Principal's Office directly to discuss their feedback offline and resolve it.`
}

LENGTH: Keep the response concise, brief, and under 350 characters.
`;

  // 1. OpenAI Fallback / Test Mode Execution
  if (OPENAI_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (err: any) {
      console.error('OpenAI review reply failed:', err.response?.data || err.message);
      throw new Error(`OpenAI review reply execution failed: ${err.message}`);
    }
  }

  // 2. Default Gemini Execution
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generates an SEO post copy blueprint update.
 */
export async function generatePostCopy(
  clientName: string,
  primaryCategory: string,
  serviceArea: string,
  keywords: string[],
  topic: string,
  businessType: 'healthcare' | 'education',
  boostKeywords?: string[]
): Promise<string> {
  const prompt = `
You are an expert copywriter for ${
    businessType === 'healthcare' 
      ? 'healthcare clinics and hospitals' 
      : 'schools, colleges, academies, and coaching institutes'
  }. Write an engaging, professional, and SEO-optimized Google Business Profile Post update (under 1000 characters) for our client.

BUSINESS DETAILS:
- Name: ${clientName}
- Category: ${primaryCategory}
- Location: ${serviceArea}
- Target Keywords to naturally weave in: ${keywords.join(', ')}
${
  boostKeywords && boostKeywords.length > 0
    ? `- CRITICAL SEO BOOST INSTRUCTIONS: The client is currently ranking outside the Top 20 for these search terms: ${boostKeywords.join(', ')}. You MUST naturally and heavily prioritize weaving these exact target phrases and their locations into the post copy to improve their local SEO visibility.`
    : ''
}

POST BLUEPRINT TOPIC:
"${topic}"

REQUIREMENTS:
${
  businessType === 'healthcare'
    ? `- Sound empathetic, highly professional, and informative.
- Include a friendly call-to-action (CTA) invite at the end, encouraging them to book a consultation.`
    : `- Sound encouraging, inspiring, and professional.
- Include a friendly call-to-action (CTA) inviting students or parents to contact the campus, apply online, or register for courses.`
}
- Keep it under 1000 characters so it fits GMB length restrictions.
- Add 2-3 relevant hashtags (e.g., #${businessType === 'healthcare' ? 'Healthcare' : 'Education'}, #ClinicOrAcademyName, #Location).
- Output ONLY the final post text. Do not include markdown headers or title styling.
`;

  // 1. OpenAI Fallback / Test Mode Execution
  if (OPENAI_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (err: any) {
      console.error('OpenAI post copywriting failed:', err.response?.data || err.message);
      throw new Error(`OpenAI post copywriting execution failed: ${err.message}`);
    }
  }

  // 2. Default Gemini Execution
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generates monthly trending SEO keywords, optimal Google categories, and seasonal FAQs for a specific niche
 */
export async function generateNicheTrendsForMonth(
  niche: string,
  categoryType: string
): Promise<{ trendingKeywords: string[]; recommendedCategories: string[]; faqs: string[] }> {
  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const prompt = `You are a Senior SEO Strategy Expert for local business optimization on Google Maps.
We are conducting monthly niche search trend research for: "${niche}" (in the "${categoryType}" sector) for the current period: ${currentMonthYear}.

Please analyze current seasonal search intent and provide:
1. 12 to 15 high-ranking, high-intent local search keywords and search queries that patients/students are actively typing into Google Maps right now for this niche.
2. 3 to 5 optimal Google Business Profile primary and secondary categories.
3. 3 top seasonal FAQs with high local search volume.

Respond ONLY with a valid JSON object in this exact format (no markdown code blocks, no explanation text):
{
  "trendingKeywords": ["keyword 1", "keyword 2", ...],
  "recommendedCategories": ["Category 1", "Category 2", ...],
  "faqs": ["Question 1?", "Question 2?", "Question 3?"]
}`;

  try {
    let rawText = '';
    if (OPENAI_API_KEY) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      rawText = response.data.choices[0].message.content.trim();
    } else if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig: { responseMimeType: "application/json" } });
      const result = await model.generateContent(prompt);
      rawText = result.response.text().trim();
    } else {
      throw new Error('No AI API keys configured');
    }

    const parsed = JSON.parse(rawText);
    return {
      trendingKeywords: Array.isArray(parsed.trendingKeywords) ? parsed.trendingKeywords : [],
      recommendedCategories: Array.isArray(parsed.recommendedCategories) ? parsed.recommendedCategories : [],
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : []
    };
  } catch (err: any) {
    console.error(`AI Niche Trends generation failed for "${niche}":`, err.message);
    return {
      trendingKeywords: [`best ${niche.toLowerCase()} near me`, `top ${niche.toLowerCase()} clinic`, `affordable ${niche.toLowerCase()} services`],
      recommendedCategories: [niche, 'Medical Clinic', 'Educational Institution'],
      faqs: [`What are the consultation timings for ${niche}?`, `How much does treatment cost at ${niche}?`, `How do I book an appointment?`]
    };
  }
}

