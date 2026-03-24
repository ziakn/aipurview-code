import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TEST_EMAIL = process.env.E2E_EMAIL || "verifywise@email.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "Verifywise#1";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Log in to your account")).toBeVisible();
    await expect(
      page.getByPlaceholder("name.surname@companyname.com")
    ).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("redirects to /login when accessing protected route without auth", async ({
    page,
  }) => {
    await page.goto("/vendors");
    await expect(page).toHaveURL(/\/login/);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByPlaceholder("name.surname@companyname.com")
      .fill(TEST_EMAIL);
    await page.getByPlaceholder("Enter your password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to the dashboard
    await expect(page).toHaveURL("/", { timeout: 15_000 });
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByPlaceholder("name.surname@companyname.com")
      .fill("bad@email.com");
    await page.getByPlaceholder("Enter your password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // An error alert should appear
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Forgot password").click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("register link navigates correctly", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Register here").click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("login page has no accessibility violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  // --- Logout ---

  test("logout redirects to login page", async ({ page }) => {
    // Login first via UI
    await page.goto("/login");
    await page
      .getByPlaceholder("name.surname@companyname.com")
      .fill(TEST_EMAIL);
    await page.getByPlaceholder("Enter your password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    // Find sidebar footer / more button / user menu to trigger logout
    const logoutTrigger = page
      .getByRole("button", { name: /logout|sign out/i })
      .or(page.getByText(/logout/i))
      .or(page.getByText(/sign out/i));

    // Try direct logout button first
    if (await logoutTrigger.first().isVisible().catch(() => false)) {
      await logoutTrigger.first().click();
    } else {
      // Look for user menu / more button in sidebar footer
      const moreBtn = page
        .locator('[data-testid="more-menu"]')
        .or(page.locator('[aria-label="more"]'))
        .or(page.getByRole("button", { name: /more/i }))
        .or(page.locator('[class*="sidebar"] button').last());

      if (await moreBtn.first().isVisible().catch(() => false)) {
        await moreBtn.first().click();
        await page.waitForTimeout(500);

        const logoutBtn = page
          .getByRole("menuitem", { name: /logout|sign out/i })
          .or(page.getByText(/logout/i))
          .or(page.getByText(/sign out/i));
        if (await logoutBtn.first().isVisible().catch(() => false)) {
          await logoutBtn.first().click();
        }
      }
    }

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  // --- Registration form ---

  test("registration page renders form fields", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Verify registration form fields are present
    const nameField = page
      .getByPlaceholder(/first name/i)
      .or(page.getByRole("textbox", { name: /first name/i }))
      .or(page.getByPlaceholder(/name/i));
    const emailField = page
      .getByPlaceholder(/email/i)
      .or(page.getByRole("textbox", { name: /email/i }));
    const passwordField = page
      .getByPlaceholder(/password/i)
      .first();

    await expect(nameField.first()).toBeVisible({ timeout: 10_000 });
    await expect(emailField.first()).toBeVisible({ timeout: 10_000 });
    await expect(passwordField).toBeVisible({ timeout: 10_000 });
  });

  test("registration form shows validation on empty submit", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");

    // Find and click submit button
    const submitBtn = page
      .getByRole("button", { name: /sign up|register|create account/i });

    if (await submitBtn.first().isVisible().catch(() => false)) {
      await submitBtn.first().click();
      await page.waitForTimeout(500);

      // Verify validation errors appear
      const error = page
        .getByText(/required/i)
        .or(page.getByText(/please/i))
        .or(page.getByText(/invalid/i))
        .or(page.locator(":invalid"))
        .or(page.getByRole("alert"));
      await expect(error.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  // --- Password reset form ---

  test("forgot password page renders form", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("domcontentloaded");

    // Verify email field and submit button
    const emailField = page
      .getByPlaceholder(/email/i)
      .or(page.getByRole("textbox", { name: /email/i }))
      .or(page.getByRole("textbox").first());
    const submitBtn = page
      .getByRole("button", { name: /send|reset|submit/i });

    await expect(emailField.first()).toBeVisible({ timeout: 10_000 });
    await expect(submitBtn.first()).toBeVisible({ timeout: 10_000 });
  });

  test("forgot password form shows validation on empty submit", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("domcontentloaded");

    const submitBtn = page
      .getByRole("button", { name: /send|reset|submit/i });

    if (await submitBtn.first().isVisible().catch(() => false)) {
      await submitBtn.first().click();
      await page.waitForTimeout(500);

      // Verify validation error
      const error = page
        .getByText(/required/i)
        .or(page.getByText(/please/i))
        .or(page.getByText(/invalid/i))
        .or(page.locator(":invalid"))
        .or(page.getByRole("alert"));
      await expect(error.first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
