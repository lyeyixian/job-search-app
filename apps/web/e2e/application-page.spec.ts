import { expect, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/application-page.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

// A link to the posting, a source listing, a resume, each grade and each bridging action.
const FULL = "/applications/example-co-backend-engineer";
// No link, no source listing, no resume.
const BARE = "/applications/pine-street-backend-engineer";

const tab = (page: Page, name: string) => page.getByRole("tab", { name });
const requirement = (page: Page, name: string) => page.getByTestId("requirement").filter({ hasText: name });

test("application-page 1: see the facts of the application", async ({ page }) => {
  await page.goto(FULL);

  await expect(page.getByTestId("application-company")).toHaveText("Example Co");
  await expect(page.getByRole("heading", { level: 1, name: "Backend Engineer" })).toBeVisible();
  await expect(page.getByTestId("fact-region")).toHaveText("Singapore");
  await expect(page.getByTestId("fact-status")).toHaveText("Applied");
  await expect(page.getByTestId("fact-verdict")).toHaveText("Good fit");
  await expect(page.getByTestId("fact-direction")).toHaveText("Aligned");
  await expect(page.getByTestId("fact-captured")).toHaveText("5 Oct 2026");
  await expect(page.getByTestId("fact-analyzed")).toHaveText("7 Oct 2026");

  // The facts are at the top of the page, before the parts.
  const facts = await page.getByTestId("application-facts").boundingBox();
  const parts = await page.getByRole("tablist").boundingBox();
  expect(facts?.y).toBeLessThan(parts?.y ?? 0);
});

test("application-page 2: open the posting on the job board", async ({ page }) => {
  // The job board of the fixture is not a real site. The test answers for it.
  await page
    .context()
    .route("https://example.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>Job board</title>" }),
    );
  await page.goto(FULL);

  const link = page.getByRole("link", { name: "Posting on the job board" });
  const [board] = await Promise.all([page.waitForEvent("popup"), link.click()]);
  await board.waitForLoadState();
  expect(board.url()).toBe("https://example.com/careers/1001");
  expect(page.url()).toContain(FULL);

  // An application with no link shows no link and no empty space for one.
  await page.goto(BARE);
  await expect(page.getByTestId("application-facts")).toBeVisible();
  await expect(page.getByRole("link", { name: "Posting on the job board" })).toHaveCount(0);
  await expect(page.getByTestId("application-links")).toHaveCount(0);
});

test("application-page 3: read the posting and the fit analysis as two parts", async ({ page }) => {
  await page.goto(FULL);

  await expect(tab(page, "Fit analysis")).toBeVisible();
  await expect(tab(page, "Posting")).toBeVisible();

  // One selection goes to the posting. The fit analysis is not on the page to scroll through.
  await tab(page, "Posting").click();
  await expect(page.getByTestId("part-posting")).toContainText("The Developer Tools team builds the services");
  await expect(page.getByTestId("part-posting")).not.toContainText("Direction check");
  await expect(page.getByTestId("part-fit")).toHaveCount(0);

  // One selection goes back to the fit analysis.
  await tab(page, "Fit analysis").click();
  await expect(page.getByTestId("part-fit")).toContainText("Direction check");
  await expect(page.getByTestId("part-fit")).not.toContainText("The Developer Tools team builds the services");
  await expect(page.getByTestId("part-posting")).toHaveCount(0);
});

test("application-page 4: the fit analysis comes first", async ({ page }) => {
  await page.goto(FULL);

  await expect(tab(page, "Fit analysis")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("fit-verdict")).toContainText("three of the four are met");
  await expect(page.getByTestId("part-posting")).toHaveCount(0);

  // The tab of the fit analysis is before the tab of the posting.
  const fit = await tab(page, "Fit analysis").boundingBox();
  const posting = await tab(page, "Posting").boundingBox();
  expect(fit?.x).toBeLessThan(posting?.x ?? 0);
});

test("application-page 5: read the requirements table", async ({ page, isMobile }) => {
  await page.goto(FULL);

  await expect(page.getByTestId("requirement")).toHaveCount(6);
  const row = requirement(page, "Has run a service on Kubernetes");
  await expect(row.getByTestId("requirement-kind")).toContainText("Must-have");
  await expect(row.getByTestId("requirement-firmness")).toContainText('likely-firm: "has run", not "knows"');
  await expect(row.getByTestId("requirement-grade")).toContainText("Partial");
  await expect(row.getByTestId("requirement-evidence")).toContainText("Docker in production, but no cluster.");

  // The three grades differ in the word, the mark and the colour.
  const look = async (name: string) => {
    const badge = requirement(page, name).getByTestId("grade");
    return {
      grade: await badge.getAttribute("data-grade"),
      text: await badge.innerText(),
      colour: await badge.evaluate((element) => getComputedStyle(element).backgroundColor),
    };
  };
  const met = await look("Three years of backend work");
  const partial = await look("Has run a service on Kubernetes");
  const gap = await look("Experience with a public API");
  expect([met.grade, partial.grade, gap.grade]).toEqual(["met", "partial", "gap"]);
  expect(new Set([met.text, partial.text, gap.text]).size).toBe(3);
  expect(new Set([met.colour, partial.colour, gap.colour]).size).toBe(3);

  if (isMobile) {
    // On a phone each requirement is in full on the screen: no part is cut, and the page does
    // not scroll sideways.
    const viewport = page.viewportSize()?.width ?? 0;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport);
    for (const cell of await row.locator("td").all()) {
      const box = await cell.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport);
      expect(await cell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    // Each value says which column it is from.
    await expect(row.getByTestId("requirement-firmness")).toContainText("Firmness");
    await expect(row.getByTestId("requirement-evidence")).toContainText("Evidence");
  }
});

test("application-page 6: go from evidence to the achievement", async ({ page }) => {
  await page.goto(FULL);

  await requirement(page, "Three years of backend work").getByRole("link", { name: "Cut build time" }).click();

  await expect(page).toHaveURL(/\/experience\/roles\/northwind-software-engineer#cut-build-time$/);
  await expect(page.getByRole("heading", { level: 1, name: "Software Engineer, Northwind Traders" })).toBeVisible();
  const achievement = page.getByRole("heading", { level: 3, name: "Cut build time" });
  await expect(achievement).toHaveAttribute("id", "cut-build-time");
  await expect(achievement).toBeInViewport();
  await expect(page.getByText("The build takes 9 minutes.")).toBeVisible();

  // Evidence can name an achievement of a project note.
  await page.goBack();
  await requirement(page, "Experience with a relational database").getByRole("link", { name: "Shopping list" }).click();
  await expect(page).toHaveURL(/\/experience\/projects\/recipe-box#shopping-list$/);
  await expect(page.getByRole("heading", { level: 3, name: "Shopping list" })).toBeInViewport();
});

test("application-page 7: read the gaps", async ({ page }) => {
  await page.goto(FULL);

  const gaps = page.getByTestId("gap");
  await expect(gaps).toHaveCount(3);
  const positioning = gaps.filter({ hasText: "Has run a service on Kubernetes" });
  await expect(positioning.getByTestId("gap-action")).toHaveText("Positioning");
  await expect(positioning).toContainText("Name Docker in the build pipeline bullet");
  const learning = gaps.filter({ hasText: "Experience with a public API" });
  await expect(learning.getByTestId("gap-action")).toHaveText("Learning");
  await expect(learning).toContainText("Publish the API of the recipe box");
  for (const gap of await gaps.all()) {
    await expect(gap.getByTestId("gap-action")).toHaveText(/^(Positioning|Learning)$/);
  }
});

test("application-page 8: see the tailored resume", async ({ page }) => {
  await page.goto(FULL);
  await tab(page, "Resume").click();

  // The resume as it prints: PDF.js draws the page of the PDF, and the page is not blank.
  const resume = page.getByTestId("resume");
  await expect(resume).toHaveAttribute("data-state", "ready");
  const sheet = resume.getByTestId("resume-page");
  await expect(sheet).toHaveCount(1);
  const drawn = await sheet.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data ?? [];
    let dark = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if ((pixels[i] ?? 255) < 128) dark++;
    }
    return { dark, ratio: canvas.height / canvas.width };
  });
  expect(drawn.dark).toBeGreaterThan(0);
  // The sheet has the shape of a printed page, taller than it is wide.
  expect(drawn.ratio).toBeGreaterThan(1.2);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    resume.getByRole("link", { name: "Download the resume" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("example-co-backend-engineer-resume.pdf");

  // An application with no tailored resume.
  await page.goto(BARE);
  await tab(page, "Resume").click();
  await expect(page.getByTestId("no-resume")).toHaveText("No resume exists yet for this application.");
  await expect(page.getByTestId("resume")).toHaveCount(0);
});

test("application-page 9: go to the listing that the application came from", async ({ page }) => {
  await page.goto(FULL);

  const link = page.getByTestId("application-listing").getByRole("link", { name: "Backend Engineer" });
  await expect(link).toHaveAttribute("href", "/companies/example-co/listings/backend-engineer-1001");

  // The link is at the top of the page, before the parts.
  const parts = await page.getByRole("tablist").boundingBox();
  expect((await link.boundingBox())?.y).toBeLessThan(parts?.y ?? 0);

  // An application that did not come from a listing has no such link.
  await page.goto(BARE);
  await expect(page.getByTestId("application-facts")).toBeVisible();
  await expect(page.getByTestId("application-listing")).toHaveCount(0);
});

test("application-page 10: go back to the board", async ({ page }) => {
  await page.goto("/applications");
  const filters = page.getByTestId("board-filters");
  await filters.getByLabel("Company").selectOption("Example Co");
  await expect(page.getByTestId("application-card")).toHaveCount(2);
  await filters.getByLabel("Verdict").selectOption("good-fit");
  await expect(page.getByTestId("application-card")).toHaveCount(1);

  const sameBoard = async () => {
    await expect(page).toHaveURL(/\/applications\?company=Example\+Co&verdict=good-fit$/);
    await expect(filters.getByLabel("Company")).toHaveValue("Example Co");
    await expect(filters.getByLabel("Verdict")).toHaveValue("good-fit");
    await expect(page.getByTestId("application-card")).toHaveCount(1);
  };

  // Back in the browser.
  await page.getByTestId("application-card").click();
  await expect(page.getByTestId("application-facts")).toBeVisible();
  await page.goBack();
  await sameBoard();

  // The link on the page.
  await page.getByTestId("application-card").click();
  await expect(page.getByTestId("application-facts")).toBeVisible();
  await page.getByRole("link", { name: "Back to the board" }).click();
  await sameBoard();
});
