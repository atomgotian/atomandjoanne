import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500));
  await page.click('#intro-overlay').catch(() => {});
  await new Promise((r) => setTimeout(r, 1000));
  await page.evaluate(() => document.getElementById('our-story-grid').scrollIntoView());
  await new Promise((r) => setTimeout(r, 1500));

  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.story-tile img')).map((img) => ({
      src: img.src.split('/').pop(),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      tileAspect: img.closest('.story-tile').style.aspectRatio,
    }));
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
