import puppeteer from 'puppeteer';

async function main() {
  const [,, url, selector, out, width, height] = process.argv;
  const w = parseInt(width || '1440', 10);
  const h = parseInt(height || '900', 10);

  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: w, height: h } });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500));
  await page.click('#intro-overlay').catch(() => {});
  await new Promise((r) => setTimeout(r, 1000));
  await page.evaluate((sel) => {
    document.querySelector(sel).scrollIntoView({ block: 'start' });
  }, selector);
  await new Promise((r) => setTimeout(r, 800));
  const el = await page.$(selector);
  if (!el) {
    console.error('Selector not found:', selector);
    process.exit(1);
  }
  await el.screenshot({ path: out });
  await browser.close();
  console.log('Saved', out);
}

main().catch((err) => { console.error(err); process.exit(1); });
