import { expect, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/company-listings.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

const companyRow = (page: Page, company: string) =>
  page.locator(`[data-testid="company-row"][data-company="${company}"]`);
const rows = (page: Page) => page.getByTestId("listing-row");
const row = (page: Page, slug: string) => page.locator(`[data-testid="listing-row"][data-slug="${slug}"]`);
const slugs = (page: Page) =>
  rows(page).evaluateAll((elements) => elements.map((element) => element.getAttribute("data-slug")));

/** The page is as wide as the screen, on a phone too. */
async function expectNoSidewaysScroll(page: Page) {
  const viewport = page.viewportSize()?.width ?? 0;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport);
}

test("company-listings 1: find a company", async ({ page }) => {
  await page.goto("/companies");

  await expect(page.getByRole("heading", { level: 1, name: "Companies" })).toBeVisible();
  await expect(page.getByTestId("companies-count")).toHaveText("4");
  await expect(page.getByTestId("company-name")).toHaveText([
    "Example Co",
    "Kestrel Pay",
    "Marlow Freight",
    "Orchard Robotics",
  ]);

  // Kestrel Pay has four listings with the triage `shortlist`. One of them is closed.
  const kestrel = companyRow(page, "kestrel-pay");
  await expect(kestrel.getByTestId("company-mode")).toHaveText("Active");
  await expect(kestrel.getByTestId("company-last-swept")).toContainText("18 Oct 2026");
  await expect(kestrel.getByTestId("company-shortlisted")).toContainText("3");

  const marlow = companyRow(page, "marlow-freight");
  await expect(marlow.getByTestId("company-mode")).toHaveText("Watch");
  await expect(marlow.getByTestId("company-last-swept")).toContainText("14 Oct 2026");
  await expect(marlow.getByTestId("company-shortlisted")).toContainText("0");
  await expectNoSidewaysScroll(page);

  await kestrel.getByTestId("company-name").click();
  await expect(page).toHaveURL(/\/companies\/kestrel-pay$/);
  await expect(page.getByRole("heading", { level: 1, name: "Kestrel Pay" })).toBeVisible();
});

test("company-listings 2: see the listings of one company", async ({ page }) => {
  await page.goto("/companies/example-co");

  await expect(page.getByRole("heading", { level: 1, name: "Example Co" })).toBeVisible();
  // Two listings with the triage `shortlist`, then one with `maybe`. The rejected listing is not here.
  expect(await slugs(page)).toEqual(["backend-engineer-1001", "platform-engineer-1002", "data-engineer-1004"]);
  await expect(page.getByTestId("listings-count")).toHaveText("3");

  const listing = row(page, "data-engineer-1004");
  await expect(listing.getByTestId("row-title")).toHaveText("Data Engineer");
  await expect(listing.getByTestId("row-level")).toContainText("Senior");
  await expect(listing.getByTestId("row-triage")).toHaveText("Maybe");
  await expect(listing.getByTestId("row-reason")).toHaveText("Data pipelines, senior level");
  await expect(listing.getByTestId("row-first-seen")).toContainText("1 Oct 2026");
  await expect(listing.getByTestId("row-last-seen")).toContainText("8 Oct 2026");
  await expect(listing.getByTestId("row-state")).toContainText("Closed");

  await expect(row(page, "backend-engineer-1001").getByTestId("row-triage")).toHaveText("Shortlist");
  await expect(row(page, "backend-engineer-1001").getByTestId("row-state")).toContainText("Open");
  await expectNoSidewaysScroll(page);
});

test("company-listings 3: rejected listings are hidden first", async ({ page }) => {
  await page.goto("/companies/kestrel-pay");

  await expect(rows(page)).toHaveCount(4);
  await expect(row(page, "engineering-manager-2005")).toHaveCount(0);
  await expect(page.getByTestId("listings-hidden")).toHaveText("1 rejected listing is hidden.");

  await page.getByRole("link", { name: "Show rejected listings" }).click();

  // The choice is in the address, so Back and a bookmark keep it.
  await expect(page).toHaveURL(/\/companies\/kestrel-pay\?rejected=show$/);
  await expect(rows(page)).toHaveCount(5);
  // The rejected listing is in the same list, after the others.
  expect((await slugs(page)).at(-1)).toBe("engineering-manager-2005");
  await expect(row(page, "engineering-manager-2005").getByTestId("row-triage")).toHaveText("Reject");
  await expect(page.getByTestId("listings-hidden")).toHaveCount(0);

  await page.getByRole("link", { name: "Hide rejected listings" }).click();
  await expect(page).toHaveURL(/\/companies\/kestrel-pay$/);
  await expect(rows(page)).toHaveCount(4);
});

test("company-listings 4: closed listings look different", async ({ page }) => {
  const look = (slug: string) =>
    row(page, slug).evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      title: getComputedStyle(element.querySelector('[data-testid="row-title"]') as Element).textDecorationLine,
    }));

  await page.goto("/companies/kestrel-pay");
  const open = await look("software-engineer-2001");
  const closed = await look("site-reliability-engineer-2004");

  // The row of a listing that is not open is grey, its title has a line through it, and its state is a badge.
  expect(closed.background).not.toBe(open.background);
  expect(open.title).not.toContain("line-through");
  expect(closed.title).toContain("line-through");
  await expect(row(page, "site-reliability-engineer-2004").getByTestId("row-state")).toContainText("Closed");
  await expect(
    row(page, "site-reliability-engineer-2004").locator('[data-slot="badge"]', { hasText: "Closed" }),
  ).toBeVisible();
  await expect(row(page, "software-engineer-2001").locator('[data-slot="badge"]', { hasText: "Open" })).toHaveCount(0);

  await page.goto("/companies/orchard-robotics");
  const unknown = await look("test-engineer-3003");
  expect(unknown.background).toBe(closed.background);
  expect(unknown.title).toContain("line-through");
  await expect(row(page, "test-engineer-3003").getByTestId("row-state")).toContainText("Unknown");
});

test("company-listings 5: see which listings I promoted", async ({ page }) => {
  await page.goto("/companies/example-co");

  const notPromoted = row(page, "platform-engineer-1002").getByTestId("row-application");
  await expect(notPromoted).toHaveText("Not promoted");
  await expect(notPromoted.getByRole("link")).toHaveCount(0);

  const promoted = row(page, "backend-engineer-1001").getByTestId("row-application");
  await expect(promoted).toHaveText("Applied");
  await promoted.getByRole("link").click();

  await expect(page).toHaveURL(/\/applications\/example-co-backend-engineer$/);
  await expect(page.getByTestId("application-company")).toHaveText("Example Co");
});

test("company-listings 6: read what the watchlist says about the company", async ({ page }) => {
  await page.goto("/companies/example-co");

  await expect(page.getByTestId("watchlist-mode")).toHaveText("Active");
  await expect(page.getByTestId("watchlist-last-swept")).toHaveText("20 Oct 2026");
  const board = page.getByTestId("watchlist-board").getByRole("link");
  await expect(board).toHaveAttribute("href", "https://example.com/careers");
  await expect(board).toHaveAttribute("target", "_blank");

  await expect(page.getByTestId("watchlist-notes").getByRole("listitem")).toHaveText([
    "Caps two active applications for each person, so the shortlist matters more than the long list.",
    "The level is set after the interviews.",
  ]);
  await expect(page.getByTestId("watchlist-pay")).toHaveText("Mid median about SGD 120K (a made-up number)");
  await expect(page.getByTestId("watchlist-remote")).toHaveText("hybrid, three days in the office");

  // The instructions for a sweep stay out.
  await expect(page.getByRole("main")).not.toContainText("recipe");
  await expect(page.getByRole("main")).not.toContainText("plain fetch");
  await expectNoSidewaysScroll(page);
});

test("company-listings 7: see when the company was swept", async ({ page }) => {
  await page.goto("/companies/kestrel-pay");

  await expect(page.getByTestId("company-sweeps").getByRole("listitem")).toHaveText([
    "18 Oct 2026",
    "12 Oct 2026",
    "5 Oct 2026",
    "20 Sept 2026",
  ]);
});

test("company-listings 8: read one listing", async ({ page }) => {
  await page.goto("/companies/kestrel-pay");
  await row(page, "site-reliability-engineer-2004").getByTestId("row-title").click();

  await expect(page).toHaveURL(/\/companies\/kestrel-pay\/listings\/site-reliability-engineer-2004$/);
  await expect(page.getByRole("heading", { level: 1, name: "Site Reliability Engineer" })).toBeVisible();
  await expect(page.getByTestId("listing-company")).toHaveText("Kestrel Pay");
  await expect(page.getByTestId("fact-region")).toHaveText("Singapore");
  await expect(page.getByTestId("fact-level")).toHaveText("Mid");
  await expect(page.getByTestId("fact-first-seen")).toHaveText("20 Sept 2026");

  await expect(page.getByTestId("fact-triage")).toHaveText("Shortlist");
  await expect(page.getByTestId("listing-reason")).toContainText("Reliability work on the payment services");
  await expect(page.getByTestId("fact-state")).toHaveText("Closed");
  await expect(page.getByTestId("listing-not-open")).toContainText("This listing is closed.");

  const body = page.getByTestId("listing-body");
  await expect(body).toContainText("Kestrel Pay is a made-up company. This listing is not real.");
  await expect(body.getByRole("heading", { name: "What you will do" })).toBeVisible();
  await expectNoSidewaysScroll(page);

  await page.getByRole("link", { name: "All listings of Kestrel Pay" }).click();
  await expect(page).toHaveURL(/\/companies\/kestrel-pay$/);
});

test("company-listings 9: open the listing on the job board", async ({ page }) => {
  await page.goto("/companies/example-co/listings/backend-engineer-1001");

  const link = page.getByRole("link", { name: "Listing on the job board" });
  await expect(link).toHaveAttribute("href", "https://example.com/careers/1001");

  // The test does not go to the website. It checks that the link opens a new tab.
  await page.context().route("https://example.com/**", (route) => route.fulfill({ body: "A made-up job board." }));
  const [tab] = await Promise.all([page.context().waitForEvent("page"), link.click()]);
  await expect(tab).toHaveURL("https://example.com/careers/1001");
  await expect(page).toHaveURL(/\/companies\/example-co\/listings\/backend-engineer-1001$/);
});

test("company-listings 10: go from a listing to its application", async ({ page }) => {
  await page.goto("/companies/example-co/listings/platform-engineer-1002");
  await expect(page.getByRole("heading", { level: 1, name: "Platform Engineer" })).toBeVisible();
  await expect(page.getByTestId("listing-application")).toHaveCount(0);

  await page.goto("/companies/orchard-robotics/listings/software-engineer-3001");
  const application = page.getByTestId("listing-application");
  await expect(application).toContainText("Promoted to the application");
  await application.getByRole("link", { name: "Interviewing" }).click();

  await expect(page).toHaveURL(/\/applications\/orchard-robotics-software-engineer$/);
  await expect(page.getByTestId("application-company")).toHaveText("Orchard Robotics");
});
