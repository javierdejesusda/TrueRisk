import { test, expect } from "./fixtures/auth.fixture";

test.describe("Profile", () => {
  test("profile page renders heading and subtitle", async ({ authenticatedPage: page }) => {
    await page.goto("/profile");

    const heading = page.getByRole("heading", { name: "Profile" });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Subtitle text from translations: "Customize your risk preferences and notifications"
    const subtitle = page.getByText("Customize your risk preferences");
    await expect(subtitle).toBeVisible();
  });

  test("profile page shows the email section", async ({ authenticatedPage: page }) => {
    await page.goto("/profile");

    // The ProfileForm renders an email input with label "Email" and placeholder
    const emailInput = page.getByPlaceholder(/email/i).first();
    await expect(emailInput).toBeVisible({ timeout: 15_000 });
  });

  test("profile form save button is disabled when unchanged", async ({ authenticatedPage: page }) => {
    await page.goto("/profile");

    // The save button text is from t('saveProfile')
    // Wait for the form to load
    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 15_000 });
    // Button should be disabled since no changes were made (isDirty = false)
    await expect(saveButton).toBeDisabled();
  });
});
