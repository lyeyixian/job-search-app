import { expect, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/direction-and-targets.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

const DIRECTION = "/search/direction";
const TARGETS = "/search/targets";

const body = (page: Page) => page.getByTestId("plan-body");
const title = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });
const menu = (page: Page) => page.getByRole("navigation", { name: "Menu" });

/** The page is as wide as the screen, on a phone too. */
async function expectNoSidewaysScroll(page: Page) {
  const viewport = page.viewportSize()?.width ?? 0;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport);
}

test("direction-and-targets 1: read the direction", async ({ page }) => {
  await page.goto("/applications");
  await menu(page).getByRole("link", { name: "Search" }).click();
  await expect(title(page, "Search")).toBeVisible();
  await page.getByTestId("search-parts").getByRole("link", { name: "Direction" }).click();

  await expect(page).toHaveURL(new RegExp(`${DIRECTION}$`));
  await expect(title(page, "Direction")).toBeVisible();
  // The full text, as the note has it.
  await expect(body(page)).toContainText("This direction is made up.");
  await expect(body(page)).toContainText("Backend and platform roles at mid level.");
  await expect(body(page)).toContainText("No on-call rota with fewer than four people.");
  await expect(body(page).getByRole("link", { name: "The slow build" })).toBeVisible();

  // The target roles are at the top, before the text.
  const roles = page.getByTestId("target-roles");
  await expect(roles.getByRole("listitem")).toHaveText(["Backend engineer", "Platform engineer"]);
  const rolesBox = await roles.boundingBox();
  const bodyBox = await body(page).boundingBox();
  expect(rolesBox?.y).toBeLessThan(bodyBox?.y ?? 0);

  // The note gives a month for its last update.
  await expect(page.getByTestId("plan-updated")).toHaveText("Oct 2026");
  await expectNoSidewaysScroll(page);
});

test("direction-and-targets 2: read the targets", async ({ page }) => {
  await page.goto("/applications");
  await menu(page).getByRole("link", { name: "Search" }).click();
  await page.getByTestId("search-parts").getByRole("link", { name: "Targets" }).click();

  await expect(page).toHaveURL(new RegExp(`${TARGETS}$`));
  await expect(title(page, "Targets")).toBeVisible();
  await expect(body(page)).toContainText("Where to apply this round, and in what order.");
  // The waves and the groups are headings, in the order of the note.
  await expect(body(page).getByRole("heading", { level: 2 })).toHaveText(["Wave 1", "Wave 2", "Strategy"]);
  await expect(body(page).getByRole("heading", { level: 3 })).toHaveText(["Practice", "Developer tools"]);
  // Each company is in its group.
  await expect(body(page).getByRole("list").first().getByRole("listitem")).toHaveText([
    "Marlow Freight",
    "Lumen Labs (check that it hires in Singapore)",
  ]);
  await expect(body(page).getByRole("row").nth(1)).toContainText("Orchard Robotics");
  await expect(body(page).getByRole("row").nth(1)).toContainText("Fleet control services");

  await expect(page.getByTestId("plan-updated")).toHaveText("21 Oct 2026");
  await expectNoSidewaysScroll(page);
});

test("direction-and-targets 3: move in a long page", async ({ page }) => {
  await page.goto(DIRECTION);

  const sections = page.getByTestId("plan-sections").getByRole("link");
  await expect(sections).toHaveText(["Target roles", "What I want next", "Avoid", "Constraints"]);
  // The list is before the text.
  const list = await page.getByTestId("plan-sections").boundingBox();
  const text = await body(page).boundingBox();
  expect(list?.y).toBeLessThan(text?.y ?? 0);

  await sections.filter({ hasText: "Constraints" }).click();
  await expect(page).toHaveURL(new RegExp(`${DIRECTION}#constraints$`));
  const heading = body(page).getByRole("heading", { level: 2, name: "Constraints" });
  await expect(heading).toHaveAttribute("id", "constraints");
  await expect(heading).toBeInViewport();

  // The targets have the list too.
  await page.goto(TARGETS);
  await expect(page.getByTestId("plan-sections").getByRole("link")).toHaveText(["Wave 1", "Wave 2", "Strategy"]);
  await page.getByTestId("plan-sections").getByRole("link", { name: "Strategy" }).click();
  await expect(body(page).getByRole("heading", { level: 2, name: "Strategy" })).toBeInViewport();
});

test("direction-and-targets 4: go from a target to its listings", async ({ page }) => {
  await page.goto(TARGETS);

  // The market scan has four of the six companies. The name in the text can have two parts.
  const companies = body(page).getByTestId("company-link");
  await expect(companies).toHaveText([
    "Marlow Freight",
    "Example Co",
    "Kestrel Pay / Kestrel Payments",
    "Orchard Robotics",
  ]);

  // A company that the market scan does not have is plain text, in a list and in a table.
  await expect(body(page)).toContainText("Lumen Labs (check that it hires in Singapore)");
  await expect(body(page)).toContainText("Quill Works");
  await expect(body(page).getByRole("link", { name: /Lumen Labs|Quill Works/ })).toHaveCount(0);
  // The text after the name is not part of the link, and a name in a sentence is not a link.
  await expect(body(page).getByRole("listitem").filter({ hasText: "builds developer tools" })).toHaveText(
    "Example Co: builds developer tools",
  );
  await expect(body(page).getByRole("link", { name: "Example Co" })).toHaveCount(1);

  await companies.filter({ hasText: "Kestrel Pay" }).click();
  await expect(page).toHaveURL(/\/companies\/kestrel-pay$/);
  await expect(title(page, "Kestrel Pay")).toBeVisible();
  await expect(page.getByTestId("listing-row").first()).toBeVisible();

  // A company in a table goes to its listings too.
  await page.goBack();
  await body(page).getByRole("cell").getByRole("link", { name: "Orchard Robotics" }).click();
  await expect(page).toHaveURL(/\/companies\/orchard-robotics$/);
});

test("direction-and-targets 5: know when the direction is old", async ({ page }) => {
  // The last update of the direction of the fixture is October 2026.
  // In January 2027 that is three months ago, which is not more than three months.
  await page.clock.setFixedTime(new Date("2027-01-31T12:00:00"));
  await page.goto(DIRECTION);
  await expect(page.getByTestId("plan-updated")).toHaveText("Oct 2026");
  await expect(page.getByTestId("review-due")).toHaveCount(0);

  await page.clock.setFixedTime(new Date("2027-02-01T12:00:00"));
  await page.goto(DIRECTION);
  await expect(page.getByTestId("review-due")).toHaveText(
    "The direction is due for a review. Its last update is more than three months ago.",
  );
  // The reminder is at the top, before the text.
  const reminder = await page.getByTestId("review-due").boundingBox();
  const text = await body(page).boundingBox();
  expect(reminder?.y).toBeLessThan(text?.y ?? 0);

  // The targets have no reminder.
  await page.goto(TARGETS);
  await expect(page.getByTestId("plan-updated")).toHaveText("21 Oct 2026");
  await expect(page.getByTestId("review-due")).toHaveCount(0);
});
