import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];

function getChromePath(): string | undefined {
  for (const path of CHROME_PATHS) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return undefined;
}

export async function getRankViaSerpApi(clientName: string, query: string): Promise<number | null> {
  if (!SERPAPI_KEY) throw new Error('Missing SERPAPI_KEY');
  const response = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_maps',
      q: query,
      api_key: SERPAPI_KEY,
    },
  });
  const listings = response.data.local_results || [];
  const normalizedClientName = clientName.toLowerCase().replace(/\s+/g, '');
  for (let i = 0; i < listings.length; i++) {
    const listingName = (listings[i].title || '').toLowerCase().replace(/\s+/g, '');
    if (listingName.includes(normalizedClientName) || normalizedClientName.includes(listingName)) {
      return i + 1;
    }
  }
  return null;
}

export async function getRankViaPuppeteer(clientName: string, query: string): Promise<number | null> {
  console.log(`Fallback Rank Check using Puppeteer for query: "${query}"`);
  const chromePath = getChromePath();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 10000 });
    const titles = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      return elements.map(el => el.getAttribute('aria-label')).filter(Boolean) as string[];
    });
    const normalizedClientName = clientName.toLowerCase().replace(/\s+/g, '');
    for (let i = 0; i < titles.length; i++) {
      const listingName = titles[i].toLowerCase().replace(/\s+/g, '');
      if (listingName.includes(normalizedClientName) || normalizedClientName.includes(listingName)) {
        return i + 1;
      }
    }
    return null;
  } finally {
    await browser.close();
  }
}
