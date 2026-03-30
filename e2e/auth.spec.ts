import { test as base, expect } from "@playwright/test";
import { registerUser, loginUser, bypassOnboarding } from "./fixtures/auth.fixture";

base.describe("Authentication", () => {
  base("register creates account and redirects to dashboard", async ({ page }) => {
    await registerUser(page);
    // After successful registration the app auto-signs in and navigates away from /register
    await expect(page).toHaveURL(/\/(dashboard|map|alerts)/, { timeout: 15_000 });
  });

  base("login with valid credentials reaches dashboard", async ({ page }) => {
    // First register a fresh user
    const { nickname, password } = await registerUser(page);
    await page.waitForURL(/\/(dashboard|map|alerts)/, { timeout: 15_000 });

    // Logout by clearing cookies
    await page.context().clearCookies();

    // Login with the same credentials
    await loginUser(page, nickname, password);
    await expect(page).toHaveURL(/\/(dashboard|map|alerts)/, { timeout: 15_000 });
  });

  base("unauthenticated access to /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  base("unauthenticated access to /map redirects to /login", async ({ page }) => {
    await page.goto("/map");
    await expect(page).toHaveURL(/\/login/);
  });

  base("unauthenticated access to /profile redirects to /login", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});
