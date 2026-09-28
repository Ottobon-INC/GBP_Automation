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

import path from 'path';
import os from 'os';

/**
 * Fallback Scraper: Launches a local headless browser using system Chrome to scrape Google Maps.
 * @param query e.g., "IVF Clinic Visakhapatnam"
 */
export async function scrapeCompetitorsWithPuppeteer(query: string, limit: number = 3): Promise<CompetitorScrapeResult[]> {
  const executablePath = getChromeExecutablePath();
  
  if (!executablePath) {
    console.warn('Google Chrome was not found in default paths. Puppeteer will attempt to locate it automatically.');
  }

  const uniqueProfileId = Math.random().toString(36).substring(2, 15);
  const userDataDir = path.join(os.tmpdir(), `puppeteer_profile_${uniqueProfileId}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    userDataDir,
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

    let competitorLinks = [];
    
    try {
      // Wait for EITHER search result links to appear OR the URL to change to a direct place page
      await page.waitForFunction(() => {
        const hasLinks = document.querySelectorAll('a[href*="/maps/place/"]').length > 0;
        const isPlacePage = window.location.href.includes('/maps/place/') || window.location.href.includes('/maps/dir/');
        return hasLinks || isPlacePage;
      }, { timeout: 15000 });
    } catch {
      throw new Error('No Google Maps search results found. Make sure the query is correct.');
    }

    const currentUrl = page.url();

    // Check if Google Maps redirected directly to a specific place instead of a search list
    if (currentUrl.includes('/maps/place/') || currentUrl.includes('/maps/dir/')) {
      try {
        await page.waitForSelector('h1', { timeout: 10000 });
        const name = await page.$eval('h1', el => el.textContent?.trim() || 'Business Profile');
        competitorLinks = [{ name, href: currentUrl }];
      } catch {
        throw new Error('Failed to load the direct business profile page.');
      }
    } else {
      // Extract the names and URLs of the top N listings from the search panel
      competitorLinks = await page.$$eval('a[href*="/maps/place/"]', (elements, maxLimit) => {
        return elements
          .map((el) => {
            const name = el.getAttribute('aria-label') || '';
            const href = el.getAttribute('href') || '';
            return { name, href };
          })
          .filter((item) => item.name && item.href)
          .slice(0, maxLimit as number);
      }, limit);
      
      if (competitorLinks.length === 0) {
        throw new Error('No Google Maps search results found. Make sure the query is correct.');
      }
    }

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
    // Clean up the temporary user profile directory to prevent disk bloat
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {
      console.warn(`Failed to clean up puppeteer profile at ${userDataDir}`, e);
    }
  }
}

/**
 * Orchestrates the full pre-analysis scrape in a single browser session.
 * It searches the generic query, scrolls down to find the exact rank of the target business (up to rank 40),
 * and then selectively deep-scrapes ONLY the top 3 competitors and the target business.
 */
export async function scrapePreAnalysisData(
  targetBusinessName: string,
  genericQuery: string,
  location: string
): Promise<{ exactRank: number | string, targetBusiness: CompetitorScrapeResult | null, competitors: CompetitorScrapeResult[] }> {
  const executablePath = getChromeExecutablePath();
  const uniqueProfileId = Math.random().toString(36).substring(2, 15);
  const userDataDir = path.join(os.tmpdir(), `puppeteer_profile_${uniqueProfileId}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    userDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1280,800']
  });

  const page = await browser.newPage();

  try {
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(genericQuery)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    let allLinks: { name: string, href: string }[] = [];

    // Check if it redirected to a single place page
    try {
      await page.waitForFunction(() => {
        const hasLinks = document.querySelectorAll('a[href*="/maps/place/"]').length > 0;
        const isPlacePage = window.location.href.includes('/maps/place/') || window.location.href.includes('/maps/dir/');
        return hasLinks || isPlacePage;
      }, { timeout: 15000 });
    } catch {
      throw new Error('No Google Maps search results found. Make sure the query is correct.');
    }

    if (page.url().includes('/maps/place/') || page.url().includes('/maps/dir/')) {
      // It's a direct place page, meaning they are the ONLY result
      const name = await page.$eval('h1', el => el.textContent?.trim() || 'Target Business');
      allLinks = [{ name, href: page.url() }];
    } else {
      // It's a search results list. Scroll to load up to ~40 results.
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          const feed = document.querySelector('div[role="feed"]');
          if (feed) feed.scrollTop = feed.scrollHeight;
        });
        await new Promise(r => setTimeout(r, 1200));
      }

      allLinks = await page.$$eval('a[href*="/maps/place/"]', (elements) => {
        return elements
          .map((el) => {
            const name = el.getAttribute('aria-label') || '';
            const href = el.getAttribute('href') || '';
            return { name, href };
          })
          .filter((item) => item.name && item.href);
      });
    }

    // Determine Exact Rank
    const targetNameLower = targetBusinessName.toLowerCase().trim();
    let exactRank: number | string = "40+";
    let targetLinkIndex = allLinks.findIndex(l => l.name.toLowerCase().includes(targetNameLower) || targetNameLower.includes(l.name.toLowerCase()));

    if (targetLinkIndex !== -1) {
      exactRank = targetLinkIndex + 1;
    }

    // Determine which links to deep-scrape
    // 1. Top 3 competitors (excluding the target business if it's in the top 3)
    let competitorLinksToScrape = allLinks.filter((_, i) => i !== targetLinkIndex).slice(0, 3);
    
    // 2. The target business itself
    let targetLinkToScrape = targetLinkIndex !== -1 ? allLinks[targetLinkIndex] : null;

    const scrapeDetails = async (link: { name: string, href: string }) => {
      try {
        await page.goto(link.href, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('h1', { timeout: 10000 });
        
        const placeIdMatch = link.href.match(/1s(0x[a-f0-9]+:[a-f0-9]+)/i);
        const placeId = placeIdMatch ? placeIdMatch[1] : '';

        const category = await page.evaluate(() => {
          const categoryEl = document.querySelector('button[jsaction*="category"], button[jsaction*="rating.category"]');
          if (categoryEl) return categoryEl.textContent?.trim();
          const classEl = document.querySelector('.DkEa7');
          return classEl ? classEl.textContent?.trim() : 'Local Business';
        });

        let reviewsText = 'No reviews scraped.';
        const clickedReviews = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const target = buttons.find(b => b.textContent?.includes('Reviews') || b.getAttribute('aria-label')?.includes('Reviews') || b.getAttribute('jsaction')?.includes('moreReviews'));
          if (target) { (target as HTMLElement).click(); return true; }
          return false;
        });
        
        if (clickedReviews) {
          await page.waitForSelector('span.wi7C3c', { timeout: 8000 }).catch(() => {});
          reviewsText = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('span.wi7C3c')).slice(0, 5).map((el, i) => `Review ${i + 1}: ${el.textContent?.trim() || ''}`).join('\n\n---\n\n');
          });
        }

        return { competitor_name: link.name, maps_place_id: placeId, categories_found: [category || 'Local Business'], reviews_scraped: reviewsText || 'No review comments available.' };
      } catch (err: any) {
        console.warn(`Error scraping detail for ${link.name}:`, err.message);
        return { competitor_name: link.name, maps_place_id: '', categories_found: ['Local Business'], reviews_scraped: 'Failed to scrape reviews.' };
      }
    };

    // Scrape them!
    let targetBusiness = null;
    let competitors = [];

    if (targetLinkToScrape) {
      targetBusiness = await scrapeDetails(targetLinkToScrape);
    } else {
      // Not in top 40. We must do a direct search to get its profile!
      const directQuery = `${targetBusinessName} ${location}`;
      const directSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(directQuery)}`;
      await page.goto(directSearchUrl, { waitUntil: 'networkidle2' });
      try {
        // Wait for EITHER search result links OR a direct place page
        await page.waitForFunction(() => {
          const hasLinks = document.querySelectorAll('a[href*="/maps/place/"]').length > 0;
          const isPlacePage = window.location.href.includes('/maps/place/') || window.location.href.includes('/maps/dir/');
          return hasLinks || isPlacePage;
        }, { timeout: 15000 });

        if (page.url().includes('/maps/place/') || page.url().includes('/maps/dir/')) {
          await page.waitForSelector('h1', { timeout: 10000 });
          const name = await page.$eval('h1', el => el.textContent?.trim() || targetBusinessName);
          targetBusiness = await scrapeDetails({ name, href: page.url() });
        } else {
          // Grab the first search result
          const firstLink = await page.$eval('a[href*="/maps/place/"]', (el) => {
            return { name: el.getAttribute('aria-label') || '', href: el.getAttribute('href') || '' };
          });
          if (firstLink && firstLink.href) {
            targetBusiness = await scrapeDetails(firstLink);
          }
        }
      } catch (err) {
        console.warn('Failed direct lookup for target business:', err);
      }
    }

    for (const compLink of competitorLinksToScrape) {
      competitors.push(await scrapeDetails(compLink));
    }

    return { exactRank, targetBusiness, competitors };

  } finally {
    await browser.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}
