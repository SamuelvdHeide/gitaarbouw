// Maakt een controleplaat van modellen met de lokaal geïnstalleerde Chrome.
// Gebruik: node dev/screenshot.mjs <uitvoer.png> "view=front&models=strat,tele"
import { chromium } from 'playwright-core';

const [output, query = 'view=front'] = process.argv.slice(2);
if (!output) {
  console.error('Gebruik: node dev/screenshot.mjs <uitvoer.png> "<query>"');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 2700, height: 1200 } });
  page.on('pageerror', (error) => console.error('Paginafout:', error.message));
  await page.goto(`http://127.0.0.1:5173/dev/preview.html?${query}&sheet`);
  await page.waitForSelector('body[data-done="true"]', { timeout: 240000 });
  await page.locator('body > img').screenshot({ path: output });
  console.log(`Opgeslagen: ${output}`);
} finally {
  await browser.close();
}
