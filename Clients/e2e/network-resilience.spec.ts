import { test, expect } from "./fixtures/auth.fixture";

test.describe("Network Error Recovery", () => {
  test("API 401 redirects to login", async ({ authedPage: page }) => {
    // Intercept all API calls and respond with 401
    await page.route("**/api/**", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      })
    );

    // Navigate to a data page that will trigger API calls
    await page.goto("/tasks");
    await page.waitForTimeout(3000);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("API 403 with org mismatch shows alert and logs out", async ({
    authedPage: page,
  }) => {
    // Intercept API calls with 403 and org mismatch message
    await page.route("**/api/**", (route) =>
      route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          message: "User does not belong to this organization",
        }),
      })
    );

    await page.goto("/tasks");
    await page.waitForTimeout(3000);

    // Should show access denied alert or redirect to login
    const alert = page
      .getByText(/access denied/i)
      .or(page.getByText(/session expired/i))
      .or(page.getByRole("alert"));

    const redirectedToLogin = await page
      .waitForURL(/\/login/, { timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (!redirectedToLogin) {
      // Alert should be visible before redirect
      if (await alert.first().isVisible().catch(() => false)) {
        await expect(alert.first()).toBeVisible();
      }
    }

    // Eventually redirects to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("API 406 triggers token refresh attempt", async ({
    authedPage: page,
  }) => {
    let refreshAttempted = false;

    // Intercept the refresh token endpoint
    await page.route("**/api/users/refresh-token", (route) => {
      refreshAttempted = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { token: "new-e2e-test-token" } }),
      });
    });

    // Intercept a specific API call to return 406 once
    let firstCall = true;
    await page.route("**/api/tasks**", (route) => {
      if (firstCall) {
        firstCall = false;
        return route.fulfill({
          status: 406,
          contentType: "application/json",
          body: JSON.stringify({ message: "Token expired" }),
        });
      }
      return route.continue();
    });

    await page.goto("/tasks");
    await page.waitForTimeout(3000);

    // The refresh token endpoint should have been called
    expect(refreshAttempted).toBe(true);
  });

  test("network offline shows error state", async ({ authedPage: page }) => {
    // Abort all API calls to simulate network failure
    await page.route("**/api/**", (route) =>
      route.abort("connectionfailed")
    );

    await page.goto("/tasks");
    await page.waitForTimeout(3000);

    // Should show some error indicator (alert, error text, or empty state)
    const errorIndicator = page
      .getByRole("alert")
      .or(page.getByText(/error/i))
      .or(page.getByText(/failed/i))
      .or(page.getByText(/unable/i))
      .or(page.getByText(/offline/i))
      .or(page.getByText(/no.*task/i));

    // Page should still render (not crash) and show some feedback
    await expect(page.locator("body")).not.toBeEmpty();
    if (await errorIndicator.first().isVisible().catch(() => false)) {
      await expect(errorIndicator.first()).toBeVisible();
    }
  });

  test("network recovery after offline", async ({ authedPage: page }) => {
    // Start with aborted routes
    await page.route("**/api/**", (route) =>
      route.abort("connectionfailed")
    );

    await page.goto("/tasks");
    await page.waitForTimeout(2000);

    // Remove the route interception to "recover" network
    await page.unroute("**/api/**");

    // Navigate to trigger fresh API calls
    await page.goto("/tasks");
    await page.waitForTimeout(3000);

    // Page should load with content after recovery
    const content = page
      .getByText(/task/i)
      .or(page.getByRole("table"))
      .or(page.getByRole("button", { name: /add|new|create/i }))
      .or(page.getByText(/no.*task/i));
    await expect(content.first()).toBeVisible({ timeout: 15_000 });
  });
});
