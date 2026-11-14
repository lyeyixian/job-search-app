import { expect, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/shortlist.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

const rows = (page: Page) => page.getByTestId("shortlist-row");
const row = (page: Page, company: string, slug: string) =>
  page.locator(`[data-testid="shortlist-row"][data-company="${company}"][data-slug="${slug}"]`);
const keys = (page: Page) =>
  rows(page).evaluateAll((elements) =>
    elements.map((element) => `${element.getAttribute("data-company")}/${element.getAttribute("data-slug")}`),
  );
const count = (page: Page) => page.getByTestId("shortlist-count");

test("shortlist 1: see the shortlisted listings", async ({ page }) => {
  await page.goto("/shortlist");

  await expect(page.getByRole("heading", { level: 1, name: "Shortlist" })).toBeVisible();
  await expect(rows(page)).toHaveCount(6);
  await expect(count(page)).toHaveText("6");

  const listing = row(page, "kestrel-pay", "developer-tools-engineer-2003");
  await expect(listing.getByTestId("row-company")).toHaveText("Kestrel Pay");
  await expect(listing.getByTestId("row-title")).toHaveText("Developer Tools Engineer");
  await expect(listing.getByTestId("row-level")).toContainText("unstated");
  await expect(listing.getByTestId("row-reason")).toHaveText("Build and test tools, no years bar");
  await expect(listing.getByTestId("row-first-seen")).toContainText("5 Oct 2026");

  // The page is as wide as the screen, on a phone too.
  const viewport = page.viewportSize()?.width ?? 0;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport);
});

test("shortlist 2: only open, shortlisted listings", async ({ page }) => {
  await page.goto("/shortlist");
  await expect(rows(page)).toHaveCount(6);

  // Closed with the triage `shortlist`.
  await expect(row(page, "kestrel-pay", "site-reliability-engineer-2004")).toHaveCount(0);
  // Open with the triage `maybe`.
  await expect(row(page, "orchard-robotics", "firmware-engineer-3002")).toHaveCount(0);
  // Open with the triage `reject`.
  await expect(row(page, "example-co", "support-engineer-1003")).toHaveCount(0);
  // Marlow Freight has no shortlisted listing, so it is not a choice.
  await expect(page.locator('[data-company="marlow-freight"]')).toHaveCount(0);
  await expect(page.getByLabel("Company").locator("option")).toHaveText([
    "All",
    "Example Co (2)",
    "Kestrel Pay (3)",
    "Orchard Robotics (1)",
  ]);
});

test("shortlist 3: see which listings I promoted", async ({ page }) => {
  await page.goto("/shortlist");

  await expect(row(page, "example-co", "backend-engineer-1001").getByTestId("row-application")).toHaveText("Applied");
  const notPromoted = row(page, "example-co", "platform-engineer-1002").getByTestId("row-application");
  await expect(notPromoted).toHaveText("Not promoted");
  await expect(notPromoted.getByRole("link")).toHaveCount(0);

  const promoted = row(page, "orchard-robotics", "software-engineer-3001").getByTestId("row-application");
  await expect(promoted).toHaveText("Interviewing");
  await promoted.getByRole("link").click();

  await expect(page).toHaveURL(/\/applications\/orchard-robotics-software-engineer$/);
  await expect(page.getByTestId("application-company")).toHaveText("Orchard Robotics");
});

test("shortlist 4: show only the listings that I did not promote", async ({ page }) => {
  await page.goto("/shortlist");
  await expect(rows(page)).toHaveCount(6);

  // The choice goes to the address first, and the box shows it when the page comes back.
  await page.getByLabel("Hide promoted listings").click();

  await expect(page).toHaveURL(/promoted=hide/);
  await expect(page.getByLabel("Hide promoted listings")).toBeChecked();
  await expect(rows(page)).toHaveCount(3);
  expect(await keys(page)).toEqual([
    "example-co/platform-engineer-1002",
    "kestrel-pay/payments-platform-engineer-2002",
    "kestrel-pay/developer-tools-engineer-2003",
  ]);
  await expect(page.getByTestId("row-application").getByRole("link")).toHaveCount(0);
  await expect(count(page)).toHaveText("3");

  // Each listing of Orchard Robotics has an application.
  await page.getByLabel("Company").selectOption("orchard-robotics");
  await expect(page.getByTestId("shortlist-no-match")).toHaveText("No listing matches these choices.");
  await expect(rows(page)).toHaveCount(0);

  await page.getByRole("link", { name: "Clear" }).click();
  await expect(page).toHaveURL(/\/shortlist$/);
  await expect(rows(page)).toHaveCount(6);
});

test("shortlist 5: narrow the shortlist to one company", async ({ page }) => {
  await page.goto("/shortlist");
  await expect(rows(page)).toHaveCount(6);

  await page.getByLabel("Company").selectOption({ label: "Kestrel Pay (3)" });

  await expect(page).toHaveURL(/company=kestrel-pay/);
  await expect(rows(page)).toHaveCount(3);
  await expect(page.locator('[data-testid="shortlist-row"][data-company="kestrel-pay"]')).toHaveCount(3);
  await expect(count(page)).toHaveText("3");

  // The choice is in the address, so a reload keeps it.
  await page.reload();
  await expect(page.getByLabel("Company")).toHaveValue("kestrel-pay");
  await expect(rows(page)).toHaveCount(3);
});

test("shortlist 6: newest listings first", async ({ page }) => {
  await page.goto("/shortlist");

  // The two listings of Example Co have the same day, so the title decides.
  // Kestrel Pay: 12 Oct, 5 Oct, 20 Sept.
  expect(await keys(page)).toEqual([
    "example-co/backend-engineer-1001",
    "example-co/platform-engineer-1002",
    "kestrel-pay/payments-platform-engineer-2002",
    "kestrel-pay/developer-tools-engineer-2003",
    "kestrel-pay/software-engineer-2001",
    "orchard-robotics/software-engineer-3001",
  ]);
});

test("shortlist 7: open a listing", async ({ page }) => {
  await page.goto("/shortlist");

  await row(page, "kestrel-pay", "payments-platform-engineer-2002").getByTestId("row-title").click();

  // The page of a listing is part of the company listings feature. Until that feature is
  // built, this test checks only the address.
  await expect(page).toHaveURL(/\/companies\/kestrel-pay\/listings\/payments-platform-engineer-2002$/);
});

test("shortlist 8: go to the company", async ({ page }) => {
  await page.goto("/shortlist");

  await row(page, "kestrel-pay", "payments-platform-engineer-2002").getByTestId("row-company").click();

  // The listings page of a company is part of the company listings feature. Until that
  // feature is built, this test checks only the address.
  await expect(page).toHaveURL(/\/companies\/kestrel-pay$/);
});

test("shortlist 9: no shortlisted listings", () => {
  test.skip(
    true,
    "The browser tests run on one fixture vault, and that vault has shortlisted listings. " +
      "The unit test and the API test of the shortlist cover a vault with none.",
  );
});
