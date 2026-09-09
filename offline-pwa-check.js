// Offline PWA acceptance check for a production build (dist/pwa).
//
// Verifies the full offline story: install the service worker, go offline,
// reload the app, start a game vs a bundled wasm bot, and get a bot reply.
//
// Usage:
//   1. Serve the build:  python -m http.server 8090 --directory dist/pwa
//   2. Run:              node offline-pwa-check.js [url]
//      (default url: http://127.0.0.1:8090/)
//
// Requires the `playwright` package (installed under tests/).

const path = require("path");
const { chromium } = require(path.join(
  __dirname,
  "tests",
  "node_modules",
  "playwright"
));

const URL = process.argv[2] || "http://127.0.0.1:8090/";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const fail = (message) => {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  };

  // 1. First visit: the service worker installs and precaches the app
  //    (including the wasm engines via additionalManifestEntries).
  await page.goto(URL);
  await page.waitForSelector(".square", { timeout: 30000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Precaching runs on install; give the manifest download a moment, then
  // confirm the controller is active and the engines are in the cache.
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    { timeout: 30000 }
  );
  await page.waitForTimeout(3000);
  const cached = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    const entries = [];
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      entries.push(...keys.map((request) => new URL(request.url).pathname));
    }
    return entries;
  });
  const required = [
    "/topaz/topaz_web_bg.wasm",
    "/tiltak-wasm/tiltak_wasm_bg.wasm",
  ];
  for (const asset of required) {
    if (!cached.some((entry) => entry.endsWith(asset))) {
      fail(`${asset} is not precached — offline play would fail`);
    }
  }
  console.log(
    `Service worker active; precache has ${cached.length} entries (engines included).`
  );

  // 2. Offline: reload and make sure the app still boots.
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".square", { timeout: 30000 });
  console.log("App boots offline.");

  // 3. Start a bot game offline (the "vs Bot" tab of the Add Game dialog).
  await page.click("#fab");
  await page.waitForSelector('.q-dialog .q-tab:has-text("vs Bot")', {
    timeout: 15000,
  });
  await page.click('.q-dialog .q-tab:has-text("vs Bot")');
  await page.waitForSelector('.q-dialog:has-text("Engine")', {
    timeout: 15000,
  });
  await page.click('.q-dialog .q-field:has-text("Strength")');
  await page.waitForSelector(".q-menu .q-item");
  await page.click('.q-menu .q-item:has-text("Fast")');
  await page.click('.q-dialog button:has-text("Start")');
  await page.waitForSelector(".bot-game-bar", { timeout: 15000 });
  console.log("Bot game started offline.");

  // 4. Human moves; the wasm bot must reply while offline.
  await page.click('[data-coord="c3"]');
  await page.waitForFunction(
    () => {
      const bar = document.querySelector(".bot-game-bar");
      return bar && /Your move|Game Over/i.test(bar.textContent);
    },
    { timeout: 60000 }
  );
  const barText = await page.textContent(".bot-game-bar");
  if (!/Your move/i.test(barText)) {
    fail(`Bot did not reply offline (bar says: "${barText.trim()}")`);
  } else {
    console.log("Bot replied offline. All checks passed.");
  }

  await page.screenshot({ path: "offline-pwa-check.png" });
  await browser.close();
})().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
