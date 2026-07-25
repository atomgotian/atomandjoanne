import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'temporary screenshots');

function getChromePath() {
  const argPath = process.argv.find((a) => a.startsWith('--chrome-path='));
  if (argPath) return argPath.split('=')[1];
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  return undefined;
}

function nextScreenshotNumber() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(OUT_DIR);
  const nums = files
    .map((f) => f.match(/^screenshot-(\d+)/))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node screenshot.mjs <url> [label] [--chrome-path=...]');
    process.exit(1);
  }
  const label = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;
  const executablePath = getChromePath();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));

  // scroll through the full page so scroll-triggered reveal animations fire
  // (force instant scrolling — CSS scroll-behavior:smooth would lag behind our step loop)
  await page.evaluate(async () => {
    const prevBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    await new Promise((resolve) => {
      let y = 0;
      let iterations = 0;
      const step = 400;
      const timer = setInterval(() => {
        y += step;
        iterations += 1;
        window.scrollTo(0, y);
        if (y >= document.body.scrollHeight || iterations > 60) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
    await new Promise((r) => setTimeout(r, 400));
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = prevBehavior;
  });
  await new Promise((r) => setTimeout(r, 400));

  const n = nextScreenshotNumber();
  const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
  const outPath = path.join(OUT_DIR, filename);

  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('Saved', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
