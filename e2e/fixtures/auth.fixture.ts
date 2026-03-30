import { test as base, expect, type Page } from "@playwright/test";

/** Password that satisfies the min-10 + uppercase + lowercase + digit + special rule */
const TEST_PASSWORD = "TestPass123!";

/** Zustand persist key used by app-store.ts */
const STORE_KEY = "truerisk-province";

function uniqueNickname(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Register a new user through the UI.
 * Returns the credentials for subsequent login.
 */
export async function registerUser(page: Page) {
  const nickname = uniqueNickname();
  await page.goto("/register");

  // The register form uses placeholder-based inputs (no <label> elements wrapping them)
  await page.getByPlaceholder("Username").fill(nickname);
  // Email is optional — skip it
  await page.getByPlaceholder("Password", { exact: false }).first().fill(TEST_PASSWORD);
  await page.getByPlaceholder("Confirm password").fill(TEST_PASSWORD);
  // Province select defaults to Madrid (code 28) — leave as-is

  await page.getByRole("button", { name: /create account/i }).click();

  return { nickname, password: TEST_PASSWORD };
}

/**
 * Login an existing user through the UI.
 */
export async function loginUser(
  page: Page,
  nickname: string,
  password: string,
) {
  await page.goto("/login");

  await page.getByPlaceholder("Username").fill(nickname);
  await page.getByPlaceholder("Password").fill(password);

  await page.getByRole("button", { name: /sign in/i }).click();
}

/**
 * Inject hasSeenOnboarding into the Zustand persisted store so the
 * CitizenLayout renders the actual page instead of the OnboardingFlow.
 */
export async function bypassOnboarding(page: Page) {
  await page.evaluate((key) => {
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.state) {
          parsed.state.hasSeenOnboarding = true;
          parsed.state.hasSeenWalkthrough = true;
        }
        localStorage.setItem(key, JSON.stringify(parsed));
      } catch {
        /* ignore parse errors */
      }
    } else {
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            hasSeenOnboarding: true,
            hasSeenWalkthrough: true,
          },
          version: 0,
        }),
      );
    }
  }, STORE_KEY);
}

/**
 * Extended test fixture that provides an `authenticatedPage` already
 * logged in, with onboarding bypassed, sitting on /dashboard.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await registerUser(page);
    // After register the app auto-signs in and redirects to /dashboard
    await page.waitForURL(/\/(dashboard|map|alerts)/, { timeout: 15_000 });
    await bypassOnboarding(page);
    // Reload so Zustand picks up the localStorage change
    await page.goto("/dashboard");
    await use(page);
  },
});

export { expect };
