import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

export interface CompetitorScrapeResult {
  competitor_name: string;
  maps_place_id: string;
  categories_found: string[];
  reviews_scraped: string; // Combined string of review content for Gemini analysis
}

/**
 * Searches Google Maps via SerpApi to locate competitors
 * @param query e.g., "IVF Clinic Visakhapatnam" or "Multi-Specialty Hospital Arilova"
 */
export async function getCompetitorsFromSerpApi(query: string): Promise<CompetitorScrapeResult[]> {
  if (!SERPAPI_KEY) {
    throw new Error('SERPAPI_KEY is not defined in environment variables');
  }

  // 1. Search Google Maps
  const searchUrl = 'https://serpapi.com/search.json';
  const searchResponse = await axios.get(searchUrl, {
    params: {
      engine: 'google_maps',
      q: query,
      api_key: SERPAPI_KEY,
    },
  });

  const listings = searchResponse.data.local_results || [];
  // Grab the top 3 competitor listings (excluding ourselves if we show up, but for now top 3)
  const topCompetitors = listings.slice(0, 3);

  const results: CompetitorScrapeResult[] = [];

  for (const item of topCompetitors) {
    const placeId = item.place_id;
    const name = item.title;
    
    // In SerpApi, "types" contains all categories (primary + secondary)
    const categories: string[] = item.types || (item.type ? [item.type] : []);

    let reviewsText = '';

    if (placeId) {
      try {
        // 2. Fetch detailed reviews for this place ID
        const reviewsResponse = await axios.get(searchUrl, {
          params: {
            engine: 'google_maps_reviews',
            place_id: placeId,
            api_key: SERPAPI_KEY,
          },
        });

        const reviews = reviewsResponse.data.reviews || [];
        // Combine the text of the top 5 reviews into a single block for Gemini to digest
        reviewsText = reviews
          .slice(0, 5)
          .map((r: any) => `Reviewer: ${r.user?.name || 'Anonymous'}\nRating: ${r.rating} Stars\nComment: ${r.snippet || r.text || ''}`)
          .join('\n\n---\n\n');
      } catch (err: any) {
        console.warn(`Failed to scrape reviews for competitor "${name}":`, err.message);
        reviewsText = 'No reviews available or failed to load.';
      }
    }

    results.push({
      competitor_name: name,
      maps_place_id: placeId || '',
      categories_found: categories,
      reviews_scraped: reviewsText,
    });
  }

  return results;
}
