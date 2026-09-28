import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_RETRIES = 12; // Try for an hour (every 5 mins)
const RETRY_INTERVAL_MS = 5 * 60 * 1000;

async function runCron(attempt = 1) {
    try {
        console.log(`[Attempt ${attempt}] Pinging Daily Engagement Cron at http://localhost:3000/api/cron/daily-engagement...`);
        
        // Dynamic import of node-fetch isn't needed in Node 18+, standard fetch is available.
        const res = await fetch('http://localhost:3000/api/cron/daily-engagement');
        
        if (res.ok) {
            const data = await res.json();
            console.log('Cron completed successfully:', data);
            
            // Log it locally
            const logMsg = `${new Date().toISOString()} - SUCCESS - ${JSON.stringify(data)}\n`;
            fs.appendFileSync(path.join(__dirname, 'cron.log'), logMsg);
            
            // Wait 2 seconds before exiting
            setTimeout(() => process.exit(0), 2000);
        } else {
            throw new Error(`Server returned status ${res.status}`);
        }
    } catch (err) {
        console.log(`Error hitting API: ${err.message}`);
        
        // If connection refused, the Next.js server probably isn't running yet.
        if (attempt < MAX_RETRIES) {
            console.log(`Next.js server might not be running yet. Retrying in 5 minutes...`);
            setTimeout(() => runCron(attempt + 1), RETRY_INTERVAL_MS);
        } else {
            console.log('Max retries reached. Giving up for today.');
            const logMsg = `${new Date().toISOString()} - FAILED - ${err.message}\n`;
            fs.appendFileSync(path.join(__dirname, 'cron.log'), logMsg);
            process.exit(1);
        }
    }
}

console.log('--- LOCAL CRON JOB STARTED ---');
runCron();
