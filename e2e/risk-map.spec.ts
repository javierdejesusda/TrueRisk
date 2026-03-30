import { test, expect } from "./fixtures/auth.fixture";

test.describe("Risk Map", () => {
  test("map page renders the map container", async ({ authenticatedPage: page }) => {
    await page.goto("/map");
    // The map page renders a <div class="fixed inset-0"> containing the SpainAlertMap
    // MapLibre creates a canvas element inside a container with class "maplibregl-canvas"
    // Wait for the page to be meaningfully loaded — the fixed container should exist
    const mapContainer = page.locator("div.fixed.inset-0");
    await expect(mapContainer).toBeVisible({ timeout: 15_000 });
  });

  test("map page shows the report hazard button", async ({ authenticatedPage: page }) => {
    await page.goto("/map");
    // The map has a "Report hazard" button
    const reportButton = page.getByText("Report hazard");
    await expect(reportButton).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Dashboard", () => {
  test("dashboard shows title and province selector", async ({ authenticatedPage: page }) => {
    // authenticatedPage already lands on /dashboard
    const heading = page.getByRole("heading", { name: "Dashboard" });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Province selector has a label "Province" (from Dashboard translations)
    const provinceSelect = page.locator("[data-tour='province-select'] select");
    await expect(provinceSelect).toBeVisible();
  });

  test("changing province updates the selector value", async ({ authenticatedPage: page }) => {
    const provinceSelect = page.locator("[data-tour='province-select'] select");
    await expect(provinceSelect).toBeVisible({ timeout: 15_000 });

    // Change to Barcelona (code "08")
    await provinceSelect.selectOption("08");
    await expect(provinceSelect).toHaveValue("08");
  });
});
