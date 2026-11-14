import { expect, type Locator, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/application-board.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

const column = (page: Page, status: string) => page.getByTestId(`column-${status}`);
const cards = (scope: Page | Locator) => scope.getByTestId("application-card");
const card = (scope: Page | Locator, slug: string) =>
  scope.locator(`[data-testid="application-card"][data-slug="${slug}"]`);
const slugs = (scope: Locator) =>
  cards(scope).evaluateAll((elements) => elements.map((element) => element.getAttribute("data-slug")));

test("application-board 1: see the applications by status", async ({ page }) => {
  await page.goto("/");

  for (const [status, heading, count] of [
    ["analyzed", "Analyzed", 6],
    ["applied", "Applied", 2],
    ["interviewing", "Interviewing", 1],
    ["offer", "Offer", 0],
  ] as const) {
    await expect(column(page, status).getByRole("heading", { name: heading })).toBeVisible();
    await expect(cards(column(page, status))).toHaveCount(count);
    await expect(column(page, status).getByTestId("count")).toHaveText(String(count));
  }
  await expect(card(column(page, "applied"), "example-co-backend-engineer")).toBeVisible();
  await expect(card(column(page, "interviewing"), "orchard-robotics-software-engineer")).toBeVisible();
});

test("application-board 2: finished applications stay out of the way", async ({ page }) => {
  await page.goto("/applications");

  const group = page.getByTestId("finished-group");
  await expect(group).not.toHaveAttribute("open");
  await expect(card(page, "juniper-health-backend-engineer")).toBeHidden();
  await expect(group.getByTestId("finished-count-accepted")).toHaveText(/Accepted\s*1/);
  await expect(group.getByTestId("finished-count-rejected")).toHaveText(/Rejected\s*2/);
  await expect(group.getByTestId("finished-count-dropped")).toHaveText(/Dropped\s*1/);

  // The group is the last part of the board.
  const columnsBottom = (await page.getByTestId("board-columns").boundingBox())?.y ?? 0;
  expect((await group.boundingBox())?.y).toBeGreaterThan(columnsBottom);

  await group.locator("summary").click();

  await expect(card(group.getByTestId("group-accepted"), "juniper-health-backend-engineer")).toBeVisible();
  await expect(cards(group.getByTestId("group-rejected"))).toHaveCount(2);
  await expect(card(group.getByTestId("group-dropped"), "cobalt-games-software-engineer")).toBeVisible();
});

test("application-board 3: read a card", async ({ page }) => {
  await page.goto("/applications");

  const withResume = card(page, "quill-works-full-stack-engineer");
  await expect(withResume.getByTestId("card-company")).toHaveText("Quill Works");
  await expect(withResume.getByTestId("card-title")).toHaveText("Full Stack Engineer");
  await expect(withResume.getByTestId("card-region")).toHaveText("Singapore");
  await expect(withResume.getByTestId("card-verdict")).toHaveText("Good fit");
  await expect(withResume.getByTestId("card-direction")).toHaveText("Direction: caution");
  await expect(withResume.getByTestId("card-resume")).toHaveText("Resume");

  const withoutResume = card(page, "pine-street-backend-engineer");
  await expect(withoutResume.getByTestId("card-region")).toHaveText("Remote");
  await expect(withoutResume.getByTestId("card-resume")).toHaveText("No resume");
});

test("application-board 4: the best fits come first", async ({ page }) => {
  await page.goto("/applications");

  // Quill Works and Pine Street are both a good fit. Quill Works is newer.
  // Example Co and Lumen Labs are both a stretch. Example Co is newer.
  expect(await slugs(column(page, "analyzed"))).toEqual([
    "northgate-systems-software-engineer",
    "quill-works-full-stack-engineer",
    "pine-street-backend-engineer",
    "example-co-platform-engineer",
    "lumen-labs-platform-engineer",
    "tidewater-data-engineer",
  ]);
  expect(await slugs(column(page, "applied"))).toEqual([
    "kestrel-pay-software-engineer",
    "example-co-backend-engineer",
  ]);
});

test("application-board 5: narrow the board", async ({ page }) => {
  await page.goto("/applications");
  const filters = page.getByTestId("board-filters");

  await filters.getByLabel("Company").selectOption("Example Co");
  await expect(page).toHaveURL(/company=Example\+Co/);
  await expect(cards(page)).toHaveCount(2);
  await expect(column(page, "analyzed").getByTestId("count")).toHaveText("1");
  await expect(column(page, "applied").getByTestId("count")).toHaveText("1");
  await expect(column(page, "interviewing").getByTestId("count")).toHaveText("0");

  // A second choice. A card must match both.
  await expect(filters.getByLabel("Company")).toHaveValue("Example Co");
  await filters.getByLabel("Verdict").selectOption("stretch");
  await expect(cards(page)).toHaveCount(1);
  await expect(card(column(page, "analyzed"), "example-co-platform-engineer")).toBeVisible();
  await expect(column(page, "applied").getByTestId("count")).toHaveText("0");

  await filters.getByRole("link", { name: "Clear" }).click();
  await expect(page).toHaveURL(/\/applications$/);
  await expect(column(page, "analyzed").getByTestId("count")).toHaveText("6");

  await filters.getByLabel("Region").selectOption("remote");
  await expect(page).toHaveURL(/region=remote/);
  await filters.getByLabel("Direction check").selectOption("aligned");
  await expect(cards(page)).toHaveCount(2);
  await expect(card(column(page, "analyzed"), "pine-street-backend-engineer")).toBeVisible();
  await expect(card(column(page, "interviewing"), "orchard-robotics-software-engineer")).toBeVisible();
  await expect(page.getByTestId("finished-count-rejected")).toHaveText(/Rejected\s*0/);

  await filters.getByRole("link", { name: "Clear" }).click();
  await expect(cards(page)).toHaveCount(13);
});

test("application-board 6: open an application", async ({ page }) => {
  await page.goto("/applications");

  await card(page, "northgate-systems-software-engineer").click();

  await expect(page).toHaveURL(/\/applications\/northgate-systems-software-engineer$/);
  await expect(page.getByRole("heading", { level: 1, name: "Software Engineer" })).toBeVisible();
  await expect(page.getByTestId("application-company")).toHaveText("Northgate Systems");
});

test("application-board 7: a status with no applications", async ({ page }) => {
  // No application of the fixture vault has the status `offer`.
  await page.goto("/applications");

  await expect(column(page, "offer").getByRole("heading", { name: "Offer" })).toBeVisible();
  await expect(column(page, "offer").getByTestId("count")).toHaveText("0");
  await expect(cards(column(page, "offer"))).toHaveCount(0);
});

test("application-board 8: use the board on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This criterion is about a phone. The phone project runs it.");
  await page.goto("/applications");

  // Text that a phone can read without zoom: the page is as wide as the screen, and the text
  // of a card is 12 px or more.
  const viewport = page.viewportSize()?.width ?? 0;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport);
  const first = cards(column(page, "analyzed")).first();
  const box = await first.boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport);
  const sizes = await first.evaluate((element) =>
    [...element.querySelectorAll("p, span")].map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
  );
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12);

  // A swipe sideways goes to the next column.
  const fullyOnScreen = async (status: string) => {
    const box = await column(page, status).boundingBox();
    return Boolean(box && box.x >= 0 && box.x + box.width <= viewport);
  };
  expect(await fullyOnScreen("applied")).toBe(false);
  const board = page.getByTestId("board-columns");
  const boardBox = await board.boundingBox();
  const y = (boardBox?.y ?? 0) + 60;
  const client = await page.context().newCDPSession(page);
  const touch = (type: string, x?: number) =>
    client.send("Input.dispatchTouchEvent", {
      type: type as "touchStart",
      touchPoints: x === undefined ? [] : [{ x, y }],
    });
  const from = viewport - 40;
  await touch("touchStart", from);
  for (let step = 1; step <= 10; step++) {
    await touch("touchMove", from - (step * viewport * 0.6) / 10);
  }
  await touch("touchEnd");

  await expect.poll(() => fullyOnScreen("applied")).toBe(true);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});
