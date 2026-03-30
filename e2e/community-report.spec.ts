import { test, expect } from "./fixtures/auth.fixture";

test.describe("Community Report Form", () => {
  test("report form opens from the map page", async ({ authenticatedPage: page }) => {
    await page.goto("/map");

    // Wait for the "Report hazard" button to appear on the map
    const reportButton = page.getByText("Report hazard");
    await expect(reportButton).toBeVisible({ timeout: 15_000 });

    await reportButton.click();

    // The ReportForm renders as a modal overlay with heading "Report hazard"
    const formHeading = page.locator("form h2").filter({ hasText: /report hazard/i });
    await expect(formHeading).toBeVisible({ timeout: 5_000 });
  });

  test("report form shows hazard type selector and description field", async ({ authenticatedPage: page }) => {
    await page.goto("/map");

    const reportButton = page.getByText("Report hazard");
    await expect(reportButton).toBeVisible({ timeout: 15_000 });
    await reportButton.click();

    // Hazard type select should be present with "Flood" as default
    const hazardSelect = page.locator("form select");
    await expect(hazardSelect).toBeVisible({ timeout: 5_000 });

    // Description textarea
    const descriptionField = page.getByPlaceholder("Describe what you see...");
    await expect(descriptionField).toBeVisible();
  });

  test("report form can be closed with the close button", async ({ authenticatedPage: page }) => {
    await page.goto("/map");

    const reportButton = page.getByText("Report hazard");
    await expect(reportButton).toBeVisible({ timeout: 15_000 });
    await reportButton.click();

    // The close button is a <button> with text content "\u00d7" (multiplication sign)
    const closeButton = page.locator("form button").filter({ hasText: "\u00d7" });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // The form overlay should disappear
    const formHeading = page.locator("form h2").filter({ hasText: /report hazard/i });
    await expect(formHeading).not.toBeVisible({ timeout: 3_000 });
  });

  test("submit is disabled without location", async ({ authenticatedPage: page }) => {
    await page.goto("/map");

    const reportButton = page.getByText("Report hazard");
    await expect(reportButton).toBeVisible({ timeout: 15_000 });
    await reportButton.click();

    // The submit button should be disabled because no location has been shared
    const submitButton = page.getByRole("button", { name: /send report/i });
    await expect(submitButton).toBeVisible({ timeout: 5_000 });
    await expect(submitButton).toBeDisabled();
  });
});
