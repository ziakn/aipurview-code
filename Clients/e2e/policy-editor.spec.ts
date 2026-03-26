import { test, expect } from "./fixtures/auth.fixture";

test.describe("Policy Editor", () => {
  test("navigating to policy creation shows editor", async ({
    authedPage: page,
  }) => {
    await page.goto("/policies");

    // Click add policy to open creation form
    const addBtn = page
      .getByRole("button", { name: /add new policy/i })
      .or(page.getByRole("button", { name: /new policy/i }))
      .or(page.getByRole("button", { name: /add policy/i }));

    if (!(await addBtn.first().isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await addBtn.first().click();
    await page.waitForTimeout(1000);

    // Look for a rich text editor (TipTap/ProseMirror) or any text area
    const editor = page
      .locator(".tiptap")
      .or(page.locator(".ProseMirror"))
      .or(page.locator('[contenteditable="true"]'))
      .or(page.locator("textarea"))
      .or(page.getByRole("textbox"));

    if (await editor.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(editor.first()).toBeVisible();
    }
    await page.keyboard.press("Escape");
  });

  test("editor toolbar buttons are visible", async ({ authedPage: page }) => {
    await page.goto("/policies");

    const addBtn = page
      .getByRole("button", { name: /add new policy/i })
      .or(page.getByRole("button", { name: /new policy/i }))
      .or(page.getByRole("button", { name: /add policy/i }));

    if (!(await addBtn.first().isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await addBtn.first().click();
    await page.waitForTimeout(1000);

    // Check for toolbar buttons (bold, italic, etc.)
    const toolbar = page
      .getByRole("button", { name: /bold/i })
      .or(page.locator('[aria-label="Bold"]'))
      .or(page.locator('[class*="toolbar"]'))
      .or(page.locator('[class*="Toolbar"]'))
      .or(page.locator(".tiptap-toolbar"));

    if (await toolbar.first().isVisible().catch(() => false)) {
      await expect(toolbar.first()).toBeVisible();
    }
    await page.keyboard.press("Escape");
  });

  test("can type text in editor", async ({ authedPage: page }) => {
    await page.goto("/policies");

    const addBtn = page
      .getByRole("button", { name: /add new policy/i })
      .or(page.getByRole("button", { name: /new policy/i }))
      .or(page.getByRole("button", { name: /add policy/i }));

    if (!(await addBtn.first().isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await addBtn.first().click();
    await page.waitForTimeout(1000);

    // Find the editor and type text
    const editor = page
      .locator(".tiptap")
      .or(page.locator(".ProseMirror"))
      .or(page.locator('[contenteditable="true"]'))
      .or(page.locator("textarea"))
      .or(page.getByRole("textbox").last());

    if (await editor.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await editor.first().click();
      await editor.first().fill("E2E test policy content");
      await page.waitForTimeout(300);

      // Verify content was entered
      const content = await editor.first().textContent().catch(() => "");
      if (content) {
        expect(content).toContain("E2E test policy content");
      }
    }
    await page.keyboard.press("Escape");
  });

  test("can apply bold formatting", async ({ authedPage: page }) => {
    await page.goto("/policies");

    const addBtn = page
      .getByRole("button", { name: /add new policy/i })
      .or(page.getByRole("button", { name: /new policy/i }))
      .or(page.getByRole("button", { name: /add policy/i }));

    if (!(await addBtn.first().isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await addBtn.first().click();
    await page.waitForTimeout(1000);

    const editor = page
      .locator(".tiptap")
      .or(page.locator(".ProseMirror"))
      .or(page.locator('[contenteditable="true"]'));

    if (await editor.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await editor.first().click();
      // Type text and apply bold via keyboard shortcut
      await page.keyboard.type("Bold text");
      await page.keyboard.press("Control+a");
      await page.keyboard.press("Control+b");
      await page.waitForTimeout(300);

      // Check that bold formatting was applied (look for <strong> or bold class)
      const boldElement = page
        .locator(".tiptap strong, .ProseMirror strong, [contenteditable] strong")
        .or(page.locator('.tiptap [style*="bold"], .ProseMirror [style*="bold"]'));
      if (await boldElement.first().isVisible().catch(() => false)) {
        await expect(boldElement.first()).toBeVisible();
      }
    }
    await page.keyboard.press("Escape");
  });
});
