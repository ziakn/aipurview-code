import { test as base, expect, type Page } from "@playwright/test";

/**
 * Extended test fixture that provides an authenticated page with a project
 * already created. Many entities (vendors, risks, datasets) require a
 * project to exist before they can be created.
 *
 * Usage:
 *   import { test, expect } from "../fixtures/project.fixture";
 *   test("my test", async ({ projectPage, projectName }) => { ... });
 */
export const test = base.extend<{
  projectPage: Page;
  projectName: string;
}>({
  projectName: async ({}, use) => {
    await use(`E2E-Project-${Date.now()}`);
  },

  projectPage: async ({ page, projectName }, use) => {
    // storageState is already loaded by Playwright config.
    await page.goto("/overview");
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    // Click the "New use case" button
    const newProjectBtn = page
      .locator('[data-joyride-id="new-project-button"]')
      .or(page.getByRole("button", { name: /new use case/i }))
      .or(page.getByRole("button", { name: /add.*project/i }))
      .or(page.getByRole("button", { name: /new project/i }));
    await expect(newProjectBtn.first()).toBeVisible({ timeout: 15_000 });
    await newProjectBtn.first().click();

    // Handle AI-or-Not screening modal if it appears
    const skipBtn = page
      .getByRole("button", { name: /skip/i })
      .or(page.getByRole("button", { name: /no/i }));
    if (await skipBtn.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Fill project title
    const titleInput = page
      .getByRole("textbox", { name: /title/i })
      .or(page.getByPlaceholder(/title/i))
      .or(page.getByPlaceholder(/project name/i))
      .or(page.getByPlaceholder(/use case name/i))
      .or(page.locator('input[name="project_title"]'));
    await expect(titleInput.first()).toBeVisible({ timeout: 10_000 });
    await titleInput.first().fill(projectName);

    // Fill owner if visible
    const ownerInput = page
      .getByRole("textbox", { name: /owner/i })
      .or(page.getByPlaceholder(/owner/i));
    if (await ownerInput.first().isVisible().catch(() => false)) {
      await ownerInput.first().fill("E2E Test Owner");
    }

    // Select AI risk classification if dropdown exists
    const riskSelect = page
      .getByRole("combobox", { name: /risk/i })
      .or(page.getByText(/risk classification/i));
    if (await riskSelect.first().isVisible().catch(() => false)) {
      await riskSelect.first().click();
      const option = page.getByRole("option").first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      }
    }

    // Submit the project creation form
    const submitBtn = page
      .getByRole("button", { name: /create|save|submit|next|continue/i })
      .last();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    await use(page);
  },
});

export { expect };
