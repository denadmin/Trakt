// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Play vs Bot E2E Tests
 *
 * Covers the bot game setup dialog (dialogs/BotGame.vue) and the in-game
 * bot status bar (components/board/BotGameBar.vue):
 * 1. The dialog validates board size against the selected engine.
 * 2. Starting a game creates a local game with the right bot config and the
 *    status bar appears.
 * 3. The bot replies to the human's opening move.
 * 4. Takeback removes the bot's reply and the human's move.
 * 5. Resign records a resignation result and detaches the bot.
 * 6. Stop Bot detaches the bot without touching the game.
 */

async function openApp(page) {
  await page.goto("/");
  await page.waitForFunction(() => window.app && window.app.$store, {
    timeout: 30000,
  });
  await page.waitForFunction(() => window.app.$game && window.app.$game.board);
}

async function openBotDialog(page) {
  await page.click("#fab");
  // The bot setup lives in the Add Game dialog's "vs Bot" tab.
  await page.waitForSelector(".q-dialog");
  await page.click('.q-dialog .q-tab:has-text("vs Bot")');
  await page.waitForSelector('.q-dialog:has-text("Engine")');
}

async function selectOption(page, label, optionText) {
  await page.click(`.q-dialog .q-field:has-text("${label}")`);
  await page.waitForSelector(".q-menu .q-item");
  await page.click(`.q-menu .q-item:has-text("${optionText}")`);
}

async function startBotGame(page, { engine, size, strength }) {
  await openBotDialog(page);
  await selectOption(page, "Engine", engine);
  if (strength) {
    await selectOption(page, "Strength", strength);
  }
  if (size) {
    await selectOption(page, "Size", size);
  }
  await page.click('.q-dialog button:has-text("Start")');
  await page.waitForSelector(".bot-game-bar");
}

async function plyCount(page) {
  return page.evaluate(() => window.app.$store.state.game.ptn.allPlies.length);
}

test("dialog only offers board sizes the selected engine supports", async ({
  page,
}) => {
  await openApp(page);
  await openBotDialog(page);

  // Tiltak supports 4x4
  await selectOption(page, "Engine", "Tiltak");
  await page.click(`.q-dialog .q-field:has-text("Size")`);
  await page.waitForSelector(".q-menu .q-item");
  expect(await page.textContent('.q-menu .q-item:has-text("4 × 4")')).toContain(
    "4"
  );
  await page.keyboard.press("Escape");

  // Topaz does not
  await selectOption(page, "Engine", "Topaz");
  await page.click(`.q-dialog .q-field:has-text("Size")`);
  await page.waitForSelector(".q-menu .q-item");
  const sizeTexts = await page.$$eval(".q-menu .q-item", (items) =>
    items.map((item) => item.textContent.trim())
  );
  expect(sizeTexts.some((text) => text.includes("4 × 4"))).toBe(false);
  expect(sizeTexts.some((text) => text.includes("5 × 5"))).toBe(true);
});

test("bot plays a reply and takeback removes the full move", async ({
  page,
}) => {
  await openApp(page);
  await startBotGame(page, {
    engine: "Tiltak",
    size: "4 × 4",
    strength: "Fast",
  });

  // A fresh local game vs bot: human (White) to move, bot (Black) waiting.
  expect(await page.evaluate(() => window.app.$game.config.bot)).toBe("tiltak");
  expect(await plyCount(page)).toBe(0);

  // Human's opening move.
  await page.click('[data-coord="a1"]');
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 1
  );

  // The bot replies (bounded "Fast" search keeps this quick).
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 2,
    { timeout: 60000 }
  );

  // Takeback removes the bot's reply and the human's move, and the bot must
  // not immediately replay on its own.
  await page.click(".bot-game-bar button >> nth=0");
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 0
  );
  await page.waitForTimeout(1000);
  expect(await plyCount(page)).toBe(0);
});

test("navigation steps a full move so it lands on the human's turn", async ({
  page,
}) => {
  await openApp(page);
  await startBotGame(page, {
    engine: "Tiltak",
    size: "4 × 4",
    strength: "Fast",
  });

  await page.click('[data-coord="a1"]');
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 2,
    { timeout: 60000 }
  );

  // One step back from the tip lands past the human's move — not stuck on
  // the bot's turn — and nothing is deleted.
  await page.evaluate(() =>
    window.app.$store.dispatch("game/PREV", { half: false, times: 1 })
  );
  await page.waitForTimeout(1000);
  const back = await page.evaluate(() => {
    const state = window.app.$store.state;
    return {
      plies: state.game.ptn.allPlies.length,
      turn: state.game.position.turn,
      ply: state.game.position.ply ? state.game.position.ply.id : null,
      done: state.game.position.plyIsDone,
    };
  });
  expect(back.plies).toBe(2);
  expect(back.turn).toBe(1);
  // The initial position in this app is "ply 0 undone" (empty board).
  expect(back.ply).toBe(0);
  expect(back.done).toBe(false);

  // A different opening branches; the bot answers the new move.
  await page.click('[data-coord="b2"]');
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length >= 4,
    { timeout: 60000 }
  );

  // Stepping forward through history also advances past the bot's turn.
  await page.evaluate(() => window.app.$store.dispatch("game/FIRST"));
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    window.app.$store.dispatch("game/NEXT", { half: false, times: 1 })
  );
  await page.waitForTimeout(1000);
  const forward = await page.evaluate(() => {
    const state = window.app.$store.state;
    return {
      turn: state.game.position.turn,
      ply: state.game.position.ply ? state.game.position.ply.id : null,
      done: state.game.position.plyIsDone,
    };
  });
  expect(forward.turn).toBe(1);
  expect(forward.done).toBe(true);
});

test("undoing the bot's reply does not make it replay", async ({ page }) => {
  await openApp(page);
  await startBotGame(page, {
    engine: "Tiltak",
    size: "4 × 4",
    strength: "Fast",
  });

  await page.click('[data-coord="a1"]');
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 2,
    { timeout: 60000 }
  );

  // Undo removes the bot's reply AND the human's move underneath (the bot
  // would otherwise own the turn the human cannot interact with), returning
  // to the empty board; the bot must stay quiet instead of replaying.
  await page.evaluate(() => window.app.$store.dispatch("game/UNDO"));
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 0
  );
  await page.waitForTimeout(1500);
  expect(await plyCount(page)).toBe(0);

  // The rollback went through history, so redo (the arrow-forward) must be
  // available and bring the human's move back; the bot answers it afresh.
  const redoState = await page.evaluate(() => {
    const game = window.app.$store.state.game;
    return {
      canRedo: game.historyIndex < game.history.length,
      disableBoard: window.app.$store.state.ui.disableBoard,
    };
  });
  expect(redoState.canRedo).toBe(true);
  expect(redoState.disableBoard).toBe(false);

  await page.evaluate(() => window.app.$store.dispatch("game/REDO"));
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length >= 1
  );
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length >= 2,
    { timeout: 60000 }
  );
});

test("continue dialog filters engines that cannot play the board", async ({
  page,
}) => {
  await openApp(page);
  // Load a 4x4 game, then open the toolbar's continue dialog.
  await page.evaluate(() =>
    window.app.$store.dispatch("game/ADD_GAME", {
      ptn: '[Size "4"]\n\n1. a1 b1\n',
      name: "Small Board",
    })
  );
  await page.waitForFunction(() => window.app.$game.config.size === 4);
  await page.evaluate(() => {
    window.app.$router.push({ name: "bot-game", query: { continue: "1" } });
  });
  await page.waitForSelector('.q-dialog:has-text("Engine")');
  await page.click('.q-dialog .q-field:has-text("Engine")');
  await page.waitForSelector(".q-menu .q-item");
  const engineTexts = await page.$$eval(".q-menu .q-item", (items) =>
    items.map((item) => item.textContent.trim())
  );
  expect(engineTexts.some((text) => text.includes("Topaz"))).toBe(false);
  expect(engineTexts.some((text) => text.includes("Tiltak"))).toBe(true);
});

test("resign records the result and detaches the bot", async ({ page }) => {
  await openApp(page);
  await startBotGame(page, {
    engine: "Topaz",
    size: "5 × 5",
    strength: "Fast",
  });

  await page.click('[data-coord="c3"]');
  await page.waitForFunction(
    () => window.app.$store.state.game.ptn.allPlies.length === 2,
    {
      timeout: 60000,
    }
  );

  // Resign (with confirm) — human is White, so Black wins by resignation.
  await page.click(".bot-game-bar button >> nth=1");
  await page.waitForSelector(".q-dialog:has-text('Resign')");
  await page.click('.q-dialog button:has-text("Resign")');

  await page.waitForSelector(".bot-game-bar", { state: "detached" });
  expect(
    await page.evaluate(() => {
      const result = window.app.$store.state.game.ptn.tags.result;
      return result && result.text;
    })
  ).toBe("0-R");
  expect(await page.evaluate(() => window.app.$game.config.bot)).toBe(
    undefined
  );
});

test("stop bot detaches the bot without ending the game", async ({ page }) => {
  await openApp(page);
  await startBotGame(page, {
    engine: "Tiltak",
    size: "4 × 4",
    strength: "Fast",
  });

  await page.click(".bot-game-bar button >> nth=3");
  await page.waitForSelector(".bot-game-bar", { state: "detached" });

  expect(await page.evaluate(() => window.app.$game.config.bot)).toBe(
    undefined
  );
  // The board is still editable by the human (no result recorded).
  expect(
    await page.evaluate(() => {
      const result = window.app.$store.state.game.ptn.tags.result;
      return !result || result.text === "0-0";
    })
  ).toBe(true);
});
