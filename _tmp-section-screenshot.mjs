import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/private/tmp/claude-501/-Users-atom-Desktop-Wedding-atomandjoanne-website/cbcb1b16-05d3-46fe-af54-dfb3fb26ae5b/scratchpad/shots';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function getChromePath() {
  const argPath = process.argv.find((a) => a.startsWith('--chrome-path='));
  if (argPath) return argPath.split('=')[1];
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  return undefined;
}

const url = process.argv[2] || 'http://localhost:3000';
const sectionId = process.argv[3] || 'attire';
const mode = process.argv[4] || 'desktop'; // 'mobile' | 'desktop'
const label = process.argv[5] || 'shot';

const viewport = mode === 'mobile'
  ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
  : { width: 1440, height: 900 };

async function main() {
  const executablePath = getChromePath();
  const browser = await puppeteer.launch({ executablePath, headless: true, defaultViewport: viewport });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3200)); // past panda intro

  await page.evaluate((id) => {
    document.documentElement.style.scrollBehavior = 'auto';
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start' });
  }, sectionId);
  await new Promise((r) => setTimeout(r, 900)); // let reveal animations settle

  const el = await page.$(`#${sectionId}`);
  if (!el) {
    console.error(`Section #${sectionId} not found`);
    process.exit(1);
  }
  const outPath = path.join(OUT_DIR, `${label}-${mode}.png`);
  await el.screenshot({ path: outPath });
  console.log('Saved', outPath);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
