import { expect, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/links-between-notes.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

// A story with a link of each form in its text.
const STORY = "/experience/stories/slow-build";
const ROLE = "/experience/roles/northwind-software-engineer";
// An application with a link in the verdict and a link in the last gap.
const APPLICATION = "/applications/example-co-backend-engineer";
const LISTING = "/companies/example-co/listings/backend-engineer-1001";

const body = (page: Page) => page.getByTestId("note-body");
const title = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

test("links-between-notes 1: follow a link in the text of a note", async ({ page }) => {
  // A story names a project, an application and a listing.
  await page.goto(STORY);
  await body(page).getByRole("link", { name: "the recipe app" }).click();
  await expect(page).toHaveURL(/\/experience\/projects\/recipe-box$/);
  await expect(title(page, "Recipe box")).toBeVisible();

  await page.goto(STORY);
  await body(page).getByRole("link", { name: "Backend Engineer, Example Co" }).first().click();
  await expect(page).toHaveURL(new RegExp(`${APPLICATION}$`));
  await expect(title(page, "Backend Engineer")).toBeVisible();

  // The fit analysis of the application names the story.
  await page.getByTestId("fit-verdict").getByRole("link", { name: "The slow build" }).click();
  await expect(page).toHaveURL(new RegExp(`${STORY}$`));
  await expect(title(page, "The slow build")).toBeVisible();

  await body(page).getByRole("link", { name: "Backend Engineer, Example Co" }).nth(1).click();
  await expect(page).toHaveURL(new RegExp(`${LISTING}$`));
  await expect(page.getByTestId("listing-company")).toHaveText("Example Co");

  // The profile names a role.
  await page.goto("/experience");
  await page.getByTestId("profile").getByRole("link", { name: "Software Engineer, Northwind Traders" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROLE}$`));

  // The journal is not in this version. The name of a journal file is text.
  await page.goto(STORY);
  await expect(body(page)).toContainText("in the journal, 2026-10-01.");
  await expect(body(page).getByRole("link", { name: "2026-10-01" })).toHaveCount(0);
});

test("links-between-notes 2: follow a link in the facts of a note", async ({ page }) => {
  // A story names its role.
  await page.goto(STORY);
  await page.getByTestId("note-roles").getByRole("link", { name: "Software Engineer, Northwind Traders" }).click();
  await expect(page).toHaveURL(new RegExp(`${ROLE}$`));
  await expect(title(page, "Software Engineer, Northwind Traders")).toBeVisible();

  // A stint names its programme.
  await page.goto("/experience/roles/harbour-payments-rotation");
  await page.getByTestId("note-programme").getByRole("link").click();
  await expect(page).toHaveURL(/\/experience\/roles\/harbour-graduate-programme$/);
  // The page before stays in the document, hidden, so that Back is fast.
  await expect(page.getByTestId("note-team").filter({ visible: true })).toHaveText("Graduate Programme");

  // An application names its listing, and the listing names its application.
  await page.goto(APPLICATION);
  await page.getByTestId("application-listing").getByRole("link", { name: "Backend Engineer" }).click();
  await expect(page).toHaveURL(new RegExp(`${LISTING}$`));
  await page.getByTestId("listing-application").getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`${APPLICATION}$`));
  await expect(page.getByTestId("application-company")).toHaveText("Example Co");
});

test("links-between-notes 3: land on the achievement", async ({ page }) => {
  await page.goto(STORY);

  await body(page).getByRole("link", { name: "Cut build time" }).click();

  await expect(page).toHaveURL(new RegExp(`${ROLE}#cut-build-time$`));
  const achievement = page.getByRole("heading", { level: 3, name: "Cut build time" });
  await expect(achievement).toBeInViewport();
  // The achievement stands out, and the other achievement does not.
  await expect(achievement).toHaveAttribute("data-highlight", "");
  await expect(achievement).toHaveCSS("outline-style", "solid");
  await expect(page.getByRole("heading", { level: 3, name: "Service catalogue" })).toHaveCSS("outline-style", "none");
  // After a moment it looks as the other headings.
  await expect(achievement).not.toHaveAttribute("data-highlight", "", { timeout: 6000 });
  await expect(achievement).toHaveCSS("outline-style", "none");
});

test("links-between-notes 4: a link shows a readable name", async ({ page }) => {
  await page.goto(STORY);

  // A link to an achievement shows the heading of the achievement.
  await expect(body(page)).toContainText("See Cut build time.");
  // A link with a label shows the label. Each other link shows the title of its note.
  await expect(body(page)).toContainText(
    "I used the same cache in the recipe app. I told this story for Backend Engineer, Example Co, which came from the listing Backend Engineer, Example Co.",
  );
  const names = await body(page).getByTestId("note-link").allInnerTexts();
  expect(names).toEqual([
    "Cut build time",
    "the recipe app",
    "Backend Engineer, Example Co",
    "Backend Engineer, Example Co",
  ]);
  // No link shows the file name of its note, or the brackets of the vault.
  for (const fileName of ["recipe-box", "example-co-backend-engineer", "backend-engineer-1001", "[["]) {
    expect(names.join(" ")).not.toContain(fileName);
    await expect(body(page).locator("p").nth(1)).not.toContainText(fileName);
  }

  // The same holds in the fit analysis of an application.
  await page.goto(APPLICATION);
  await expect(page.getByTestId("fit-verdict")).toContainText("The story The slow build carries the build work.");
  await expect(page.getByTestId("gap").last()).toContainText("from the story of the slow build.");
  await expect(page.getByTestId("part-fit")).not.toContainText("[[");
});

test("links-between-notes 5: a link to nothing is visible", async ({ page }) => {
  await page.goto(STORY);

  // A note that does not exist, and an achievement that does not exist.
  const missing = body(page).getByTestId("missing-link");
  await expect(missing).toHaveText([
    "missing-note (missing)",
    "northwind-software-engineer#no-such-achievement (missing)",
  ]);
  await expect(missing.first()).toHaveAttribute("title", "The vault has no such note");
  await expect(missing.last()).toHaveAttribute("title", "The vault has no such achievement");
  // The name is text, so I cannot select it.
  await expect(body(page).getByRole("link", { name: /missing/ })).toHaveCount(0);
  expect(await missing.evaluateAll((elements) => elements.map((element) => element.closest("a")))).toEqual([
    null,
    null,
  ]);

  // The facts of the story name a role that does not exist.
  const roles = page.getByTestId("note-roles");
  await expect(roles.getByTestId("missing-link")).toHaveText("retired-role (missing)");
  await expect(roles.getByRole("link")).toHaveCount(1);

  // The facts of a role name a programme that does not exist.
  await page.goto("/experience/roles/tinker-studio-intern");
  const programme = page.getByTestId("note-programme");
  await expect(programme.getByTestId("missing-link")).toHaveText("tinker-summer-scheme (missing)");
  await expect(programme.getByRole("link")).toHaveCount(0);

  // Evidence that names an achievement that does not exist.
  await page.goto(APPLICATION);
  const evidence = page.getByTestId("evidence-missing");
  await expect(evidence).toHaveText("northwind-software-engineer#on-call-rota (missing)");
  expect(await evidence.evaluate((element) => element.closest("a"))).toBeNull();
});

test("links-between-notes 6: see what points to a note", async ({ page }) => {
  await page.goto(ROLE);

  const backlinks = page.getByTestId("backlinks");
  await expect(backlinks.getByRole("heading", { level: 2, name: "Notes that point here" })).toBeVisible();
  // The list is at the end of the page, after the text of the note.
  expect(
    await backlinks.evaluate((list) => {
      const text = document.querySelector('[data-testid="note-body"]');
      const after = text ? Boolean(text.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
      return after && list.parentElement?.lastElementChild === list;
    }),
  ).toBe(true);

  // One group for each kind of note.
  const groups = backlinks.getByTestId("backlink-group");
  await expect(groups.getByRole("heading", { level: 3 })).toHaveText(["Stories", "Applications", "Profile"]);
  const stories = groups.filter({ has: page.getByRole("heading", { name: "Stories" }) });
  await expect(stories.getByRole("link")).toHaveText(["The slow build", "Unclear owner"]);

  // A note that names one achievement shows the name of that achievement.
  await expect(stories.getByTestId("backlink").first()).toContainText("Cut build time");
  const application = groups
    .filter({ has: page.getByRole("heading", { name: "Applications" }) })
    .getByTestId("backlink")
    .filter({ hasText: "Backend Engineer, Example Co" });
  await expect(application.getByTestId("backlink-achievements")).toContainText("Cut build time, Service catalogue");

  // Each note in the list is a link to its page.
  await application.getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`${APPLICATION}$`));

  // An application and a listing have the list too.
  // The page before stays in the document, hidden, so the test reads only the groups that show.
  const kinds = () =>
    page
      .getByTestId("backlink-group")
      .filter({ visible: true })
      .evaluateAll((elements) => elements.map((element) => element.dataset.kind));
  await expect.poll(kinds).toEqual(["stories", "listings"]);
  await page.goto(LISTING);
  await expect.poll(kinds).toEqual(["stories", "applications"]);

  // A note that no note names has no list.
  await page.goto("/experience/projects/open-maps");
  await expect(title(page, "Open maps")).toBeVisible();
  await expect(page.getByTestId("backlinks")).toHaveCount(0);
});

test("links-between-notes 7: go back", async ({ page }) => {
  await page.goto(APPLICATION);

  // The link is in the last gap, far down the page.
  const link = page.getByTestId("gap").last().getByRole("link", { name: "the story of the slow build" });
  await link.scrollIntoViewIfNeeded();
  const place = await page.evaluate(() => window.scrollY);
  expect(place).toBeGreaterThan(100);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${STORY}$`));
  await expect(title(page, "The slow build")).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL(new RegExp(`${APPLICATION}$`));
  await expect(link).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(place - 20);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(place + 20);
});

test("links-between-notes 8: a link to the outside opens in a new tab", async ({ page }) => {
  // The website of the fixture is not a real site. The test answers for it.
  await page
    .context()
    .route("https://example.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<title>Build tool docs</title>" }),
    );
  await page.goto(STORY);

  const link = body(page).getByRole("link", { name: "build tool docs" });
  const [website] = await Promise.all([page.waitForEvent("popup"), link.click()]);
  await website.waitForLoadState();

  expect(website.url()).toBe("https://example.com/build-cache");
  // The app stays open on the same page.
  expect(page.url()).toContain(STORY);
  await expect(title(page, "The slow build")).toBeVisible();
});
