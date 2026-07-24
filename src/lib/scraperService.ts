import puppeteer from 'puppeteer';
import fs from 'fs';
import { CompetitorScrapeResult } from './serpapi';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];

// Helper to locate Chrome on the host machine
function getChromeExecutablePath(): string | undefined {
  for (const path of CHROME_PATHS) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return undefined; // Falls back to Puppeteer's default search
}

/**
 * Fallback Scraper: Launches a local headless browser using system Chrome to scrape Google Maps.
 * @param query e.g., "IVF Clinic Visakhapatnam"
 */
export async function scrapeCompetitorsWithPuppeteer(query: string): Promise<CompetitorScrapeResult[]> {
  const executablePath = getChromeExecutablePath();
  
  if (!executablePath) {
    console.warn('Google Chrome was not found in default paths. Puppeteer will attempt to locate it automatically.');
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  
  // Set user agent to avoid bot-detection blocking
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  try {
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Wait for business listings to load in the list panel
    // Google Maps uses anchor tags with href containing /maps/place/ for businesses
    try {
      await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 15000 });
    } catch {
      throw new Error('No Google Maps search results found. Make sure the query is correct.');
    }

    // Extract the names and URLs of the top 3 listings
    const competitorLinks = await page.$$eval('a[href*="/maps/place/"]', (elements) => {
      return elements
        .map((el) => {
          const name = el.getAttribute('aria-label') || '';
          const href = el.getAttribute('href') || '';
          return { name, href };
        })
        .filter((item) => item.name && item.href)
        .slice(0, 3);
    });

    const results: CompetitorScrapeResult[] = [];

    for (const comp of competitorLinks) {
      try {
        // Navigate to the individual listing page to extract details
        await page.goto(comp.href, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('h1', { timeout: 10000 });

        // 1. Place ID extraction from URL
        // Example URL: .../maps/place/Clinic+Name/data=!4m8!3m7!1s0x3a3943...
        // We can capture the hex key or use a general fallback
        const placeIdMatch = comp.href.match(/1s(0x[a-f0-9]+:[a-f0-9]+)/i);
        const placeId = placeIdMatch ? placeIdMatch[1] : '';

        // 2. Scrape Primary Category
        // In GMB sidebar, primary category is adjacent to ratings, usually having class / selector DkEa7
        // Determine a smart fallback category based on search query keywords
        const isMedical = /clinic|hospital|doctor|medical|ivf|fertility|health/i.test(query);
        const fallbackCategory = isMedical ? 'Medical Clinic' : 'Training Institute';

        const category = await page.evaluate((fallback) => {
          const categoryEl = document.querySelector('button[jsaction*="category"], button[jsaction*="rating.category"]');
          if (categoryEl) return categoryEl.textContent?.trim();
          const classEl = document.querySelector('.DkEa7');
          return classEl ? classEl.textContent?.trim() : fallback;
        }, fallbackCategory);

        // 3. Fetch Reviews
        let reviewsText = 'No reviews scraped.';
        
        // Dynamic search for reviews tab trigger
        const clickedReviews = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const target = buttons.find(
            (b) =>
              b.textContent?.includes('Reviews') ||
              b.getAttribute('aria-label')?.includes('Reviews') ||
              b.getAttribute('jsaction')?.includes('moreReviews')
          );
          if (target) {
            (target as HTMLElement).click();
            return true;
          }
          return false;
        });
        
        if (clickedReviews) {
          // Wait for review items to load in the sidebar
          await page.waitForSelector('span.wi7C3c', { timeout: 8000 }).catch(() => {});
          
          // Scrape the content of the reviews
          reviewsText = await page.evaluate(() => {
            const reviewElements = Array.from(document.querySelectorAll('span.wi7C3c'));
            return reviewElements
              .slice(0, 5)
              .map((el, i) => `Review ${i + 1}: ${el.textContent?.trim() || ''}`)
              .join('\n\n---\n\n');
          });
        }

        results.push({
          competitor_name: comp.name,
          maps_place_id: placeId,
          categories_found: [category || fallbackCategory],
          reviews_scraped: reviewsText || 'No review comments available.'
        });

      } catch (err: any) {
        console.warn(`Error scraping listing detail for "${comp.name}":`, err.message);
        // Add minimal placeholder result so we don't break the loop
        results.push({
          competitor_name: comp.name,
          maps_place_id: '',
          categories_found: ['Hospital'],
          reviews_scraped: 'Failed to scrape reviews locally.'
        });
      }
    }

    return results;

  } finally {
    await browser.close();
  }
}
