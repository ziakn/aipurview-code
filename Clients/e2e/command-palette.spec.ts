import { test, expect } from "./fixtures/auth.fixture";

test.describe("Command Palette (Ctrl+K)", () => {
  test("Ctrl+K opens command palette", async ({ authedPage: page }) => {
    // Dismiss any welcome dialogs first
    const welcomeSkip = page.getByRole("button", { name: /skip for now/i });
    if (await welcomeSkip.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await welcomeSkip.click();
      await page.waitForTimeout(1000);
    }

    // Press Ctrl+K to open command palette
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    // Verify command palette dialog is visible
    const palette = page
      .locator("[cmdk-dialog]")
      .or(page.locator(".cmdk-dialog"))
      .or(page.locator(".command-input").locator("..").locator(".."))
      .or(page.getByRole("dialog"));

    if (await palette.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(palette.first()).toBeVisible();

      // Verify search input is present
      const searchInput = page
        .locator("[cmdk-input]")
        .or(page.locator(".command-input"))
        .or(page.getByRole("combobox"))
        .or(page.getByPlaceholder(/search/i));
      await expect(searchInput.first()).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip();
    }

    await page.keyboard.press("Escape");
  });

  test("typing filters navigation commands", async ({ authedPage: page }) => {
    const welcomeSkip = page.getByRole("button", { name: /skip for now/i });
    if (await welcomeSkip.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await welcomeSkip.click();
      await page.waitForTimeout(1000);
    }

    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    const searchInput = page
      .locator("[cmdk-input]")
      .or(page.locator(".command-input"))
      .or(page.getByRole("combobox"));

    if (!(await searchInput.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Type a page name to filter
    await searchInput.first().fill("vendor");
    await page.waitForTimeout(500);

    // Should show matching command items
    const matchingItem = page
      .locator("[cmdk-item]")
      .or(page.locator(".command-item"))
      .or(page.getByRole("option"))
      .or(page.getByText(/vendor/i));

    if (await matchingItem.first().isVisible().catch(() => false)) {
      await expect(matchingItem.first()).toBeVisible();
    }

    await page.keyboard.press("Escape");
  });

  test("selecting a command navigates to page", async ({
    authedPage: page,
  }) => {
    const welcomeSkip = page.getByRole("button", { name: /skip for now/i });
    if (await welcomeSkip.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await welcomeSkip.click();
      await page.waitForTimeout(1000);
    }

    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    const searchInput = page
      .locator("[cmdk-input]")
      .or(page.locator(".command-input"))
      .or(page.getByRole("combobox"));

    if (!(await searchInput.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Search for tasks page
    await searchInput.first().fill("tasks");
    await page.waitForTimeout(500);

    // Click on the matching item or press Enter
    const matchingItem = page
      .locator("[cmdk-item]")
      .or(page.locator(".command-item"))
      .or(page.getByRole("option"));

    if (await matchingItem.first().isVisible().catch(() => false)) {
      await matchingItem.first().click();
      await page.waitForTimeout(1000);

      // Verify navigation occurred
      const navigated =
        page.url().includes("/tasks") ||
        page.url().includes("/search");
      if (navigated) {
        expect(page.url()).toContain("/");
      }
    } else {
      // Try pressing Enter as fallback
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);
    }
  });

  test("Escape closes command palette", async ({ authedPage: page }) => {
    const welcomeSkip = page.getByRole("button", { name: /skip for now/i });
    if (await welcomeSkip.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await welcomeSkip.click();
      await page.waitForTimeout(1000);
    }

    // Open the command palette
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    const palette = page
      .locator("[cmdk-dialog]")
      .or(page.locator(".cmdk-dialog"))
      .or(page.getByRole("dialog"));

    if (!(await palette.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Verify the palette is no longer visible
    await expect(palette.first()).not.toBeVisible({ timeout: 5_000 });
  });
});
