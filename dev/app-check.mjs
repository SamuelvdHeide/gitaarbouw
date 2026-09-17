// End-to-end controle van de app met de lokale Chrome: kiest een model en
// "Puur hout", controleert dat de 3D-weergave opbouwt en maakt een schermafbeelding.
// Gebruik: node dev/app-check.mjs <uitvoer.png> [modelId]
import { chromium } from 'playwright-core';

const [output = 'app-check.png', modelId = 'lespaul'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.tool:not([disabled])', { timeout: 120000 });

  await page.locator(`input[name="model"][value="${modelId}"]`).check({ force: true });
  await page.locator('#tab-color').click();
  await page.locator('input[name="finishType"][value="raw"]').check({ force: true });
  await page.waitForTimeout(4000);

  const state = await page.evaluate(() => ({
    title: document.querySelector('.stage__model')?.textContent,
    finish: document.querySelector('input[name="finishType"]:checked')?.value,
    status: document.querySelector('.stage__status')?.textContent,
    canvas: Boolean(document.querySelector('.stage__canvas canvas')),
  }));
  await page.screenshot({ path: output });
  console.log(JSON.stringify({ ...state, errors }, null, 2));
  if (errors.length || !state.canvas || state.finish !== 'raw') process.exitCode = 1;
} finally {
  await browser.close();
}
