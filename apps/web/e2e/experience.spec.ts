import { expect, type Page, test } from "@playwright/test";

// One test for each criterion of docs/features/experience.md, with the same name.
// The data is the made-up vault in fixtures/vault/.

const roleRow = (page: Page, slug: string) => page.locator(`[data-testid="role-row"][data-slug="${slug}"]`);
const stintRow = (page: Page, slug: string) => page.locator(`[data-testid="stint-row"][data-slug="${slug}"]`);
const projectRow = (page: Page, slug: string) => page.locator(`[data-testid="project-row"][data-slug="${slug}"]`);
const storyRow = (page: Page, slug: string) => page.locator(`[data-testid="story-row"][data-slug="${slug}"]`);
const slugsOf = (page: Page, testId: string) =>
  page.getByTestId(testId).evaluateAll((elements) => elements.map((element) => element.getAttribute("data-slug")));

/** The page is as wide as the screen, on a phone too. */
async function expectNoSidewaysScroll(page: Page) {
  const viewport = page.viewportSize()?.width ?? 0;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport);
}

test("experience 1: start from an overview", async ({ page }) => {
  await page.goto("/experience");

  await expect(page.getByRole("heading", { level: 1, name: "Experience" })).toBeVisible();
  await expect(page.getByTestId("profile")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Roles" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Projects" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Stories" })).toBeVisible();
  await expect(page.getByTestId("role-title")).toHaveCount(5);
  await expect(page.getByTestId("project-row")).toHaveCount(3);
  await expect(page.getByTestId("story-row")).toHaveCount(3);
  await expectNoSidewaysScroll(page);

  await page.getByRole("link", { name: "Skills inventory" }).click();
  await expect(page).toHaveURL(/\/experience\/skills$/);
  await expect(page.getByRole("heading", { level: 1, name: "Skills inventory" })).toBeVisible();
});

test("experience 2: read the profile", async ({ page }) => {
  await page.goto("/experience");

  const profile = page.getByTestId("profile");
  // The contact details.
  await expect(profile).toContainText("Alex Tan");
  await expect(profile).toContainText("+65 5550 0100");
  await expect(profile).toContainText("alex.tan@example.com");
  await expect(profile.getByRole("heading", { name: "Education" })).toBeVisible();
  await expect(profile).toContainText("Example University");
  await expect(profile.getByRole("heading", { name: "Certifications" })).toBeVisible();
  await expect(profile).toContainText("Example Cloud Practitioner (2024)");
  await expect(profile).toContainText("English (native), Mandarin Chinese (conversational)");
  await expectNoSidewaysScroll(page);
});

test("experience 3: see the roles in time order", async ({ page }) => {
  await page.goto("/experience");

  // The newest role is first. The programme has the place of its newest stint.
  await expect
    .poll(() => slugsOf(page, "role-row"))
    .toEqual(["northwind-software-engineer", "harbour-graduate-programme", "tinker-studio-intern"]);

  const current = roleRow(page, "northwind-software-engineer");
  await expect(current.getByTestId("role-company")).toHaveText("Northwind Traders");
  await expect(current.getByTestId("role-title")).toHaveText("Software Engineer");
  await expect(current.getByTestId("role-team")).toHaveText("Developer Tools");
  await expect(current.getByTestId("role-months")).toHaveText("Jul 2023 to present");

  const intern = roleRow(page, "tinker-studio-intern");
  await expect(intern.getByTestId("role-company")).toHaveText("Tinker Studio");
  await expect(intern.getByTestId("role-title")).toHaveText("Web Development Intern");
  await expect(intern.getByTestId("role-team")).toHaveText("Web");
  await expect(intern.getByTestId("role-months")).toHaveText("May 2020 to Aug 2020");
  await expectNoSidewaysScroll(page);
});

test("experience 4: see the stints of one programme together", async ({ page }) => {
  await page.goto("/experience");

  const programme = roleRow(page, "harbour-graduate-programme");
  await expect(programme.getByTestId("role-team").first()).toHaveText("Graduate Programme");
  const stints = programme.getByTestId("programme-stints");
  await expect(stints).toContainText("2 stints of this programme");
  // The stints are in the group of the programme, newest first, and not in the list of roles.
  await expect.poll(() => slugsOf(page, "stint-row")).toEqual(["harbour-search-rotation", "harbour-payments-rotation"]);
  await expect(stints.getByTestId("stint-row")).toHaveCount(2);
  await expect(roleRow(page, "harbour-search-rotation")).toHaveCount(0);

  const search = stintRow(page, "harbour-search-rotation");
  await expect(search.getByTestId("role-team")).toHaveText("Search");
  await expect(search.getByTestId("role-months")).toHaveText("Jul 2022 to Jun 2023");

  // A stint names its programme, and the programme names its stints.
  await search.getByTestId("role-title").click();
  await expect(page).toHaveURL(/\/experience\/roles\/harbour-search-rotation$/);
  await page.getByTestId("note-programme").getByRole("link").click();
  await expect(page).toHaveURL(/\/experience\/roles\/harbour-graduate-programme$/);
  await expect(page.getByTestId("note-stints").getByRole("link")).toHaveText(["Search", "Payments"]);
});

test("experience 5: read a role note", async ({ page }) => {
  await page.goto("/experience");
  await roleRow(page, "northwind-software-engineer").getByTestId("role-title").click();

  await expect(page).toHaveURL(/\/experience\/roles\/northwind-software-engineer$/);
  await expect(page.getByRole("heading", { level: 1, name: "Software Engineer, Northwind Traders" })).toBeVisible();
  await expect(page.getByTestId("note-company")).toHaveText("Northwind Traders");
  await expect(page.getByTestId("note-team")).toHaveText("Developer Tools");
  await expect(page.getByTestId("note-months")).toHaveText("Jul 2023 to present");

  const body = page.getByTestId("note-body");
  await expect(body.getByRole("heading", { name: "Context" })).toBeVisible();
  await expect(body).toContainText("The Developer Tools team owns the build pipeline");
  await expect(body.getByRole("heading", { name: "Achievements" })).toBeVisible();
  await expect(body).toContainText("The build takes 9 minutes.");
  await expect(body.getByRole("heading", { name: "Reflections" })).toBeVisible();
  await expect(body).toContainText("Small tools that remove a daily question");

  await expect(page.getByTestId("note-skills").getByRole("link")).toHaveText(["TypeScript", "PostgreSQL", "Docker"]);
  await expect(page.getByTestId("note-stories").getByRole("link")).toHaveText(["The slow build", "Unclear owner"]);
  await expectNoSidewaysScroll(page);

  await page.getByTestId("note-stories").getByRole("link", { name: "The slow build" }).click();
  await expect(page).toHaveURL(/\/experience\/stories\/slow-build$/);
});

test("experience 6: go to one achievement", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/experience/roles/northwind-software-engineer");

  const items = page.getByTestId("achievement-item");
  await expect(items.getByRole("link")).toHaveText(["Cut build time", "Service catalogue"]);

  // One selection goes to the achievement.
  await items.getByRole("link", { name: "Service catalogue" }).click();
  await expect(page).toHaveURL(/\/experience\/roles\/northwind-software-engineer#service-catalogue$/);
  await expect(page.getByTestId("note-body").getByRole("heading", { name: "Service catalogue" })).toBeInViewport();

  // The copied link opens the page at the achievement.
  await page.getByRole("button", { name: "Copy the link to Cut build time" }).click();
  await expect(page.getByRole("button", { name: "Copy the link to Cut build time" })).toHaveText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(copied).pathname + new URL(copied).hash).toBe(
    "/experience/roles/northwind-software-engineer#cut-build-time",
  );
  await page.goto(copied);
  const heading = page.getByTestId("note-body").getByRole("heading", { name: "Cut build time" });
  await expect(heading).toHaveAttribute("id", "cut-build-time");
  await expect(heading).toBeInViewport();

  // A project note has the same list.
  await page.goto("/experience/projects/course-compiler");
  await expect(page.getByTestId("achievement-item").getByRole("link")).toHaveText(["Parser", "Team code review"]);
  await expectNoSidewaysScroll(page);
});

test("experience 7: see the projects", async ({ page }) => {
  await page.goto("/experience");

  await expect.poll(() => slugsOf(page, "project-row")).toEqual(["recipe-box", "open-maps", "course-compiler"]);

  const recipes = projectRow(page, "recipe-box");
  await expect(recipes.getByTestId("project-kind")).toHaveText("Side project");
  await expect(recipes.getByTestId("project-months")).toHaveText("Feb 2024 to present");
  await expect(recipes.getByTestId("project-resume")).toHaveText("For a resume");

  const maps = projectRow(page, "open-maps");
  await expect(maps.getByTestId("project-kind")).toHaveText("Open source");
  await expect(maps.getByTestId("project-months")).toHaveText("Mar 2022 to Sept 2022");

  const compiler = projectRow(page, "course-compiler");
  await expect(compiler.getByTestId("project-kind")).toHaveText("Coursework");
  await expect(compiler.getByTestId("project-months")).toHaveText("Jan 2020 to May 2020");
  await expect(compiler.getByTestId("project-resume")).toHaveText("Not for a resume");
  await expectNoSidewaysScroll(page);
});

test("experience 8: read a project note", async ({ page }) => {
  await page.goto("/experience");
  await projectRow(page, "recipe-box").getByTestId("project-title").click();

  await expect(page).toHaveURL(/\/experience\/projects\/recipe-box$/);
  await expect(page.getByRole("heading", { level: 1, name: "Recipe box" })).toBeVisible();
  await expect(page.getByTestId("note-kind")).toHaveText("Side project");
  await expect(page.getByTestId("note-resume")).toHaveText("Can go on a resume");
  const body = page.getByTestId("note-body");
  await expect(body.getByRole("heading", { name: "Context" })).toBeVisible();
  await expect(body).toContainText("A small web app that stores recipes");
  await expect(body.getByRole("heading", { name: "Shopping list" })).toBeVisible();
  await expect(page.getByTestId("note-skills").getByRole("link")).toHaveText(["TypeScript", "PostgreSQL"]);

  const link = page.getByTestId("note-link").getByRole("link");
  await expect(link).toHaveAttribute("href", "https://example.com/recipe-box");
  await expect(link).toHaveAttribute("target", "_blank");
  await expectNoSidewaysScroll(page);

  // A note with no link shows no link.
  await page.goto("/experience/projects/course-compiler");
  await expect(page.getByTestId("note-resume")).toHaveText("Not for a resume");
  await expect(page.getByTestId("note-link")).toHaveCount(0);
});

test("experience 9: find a story by competency", async ({ page }) => {
  await page.goto("/experience");

  await expect.poll(() => slugsOf(page, "story-row")).toEqual(["first-outage", "slow-build", "unclear-owner"]);
  const choices = page.getByTestId("competency-choices");
  await choices.getByRole("link", { name: "Ownership (2)" }).click();

  // The choice is in the address, so Back and a bookmark keep it.
  await expect(page).toHaveURL(/\/experience\?competency=ownership$/);
  await expect(page.getByTestId("story-row")).toHaveCount(2);
  await expect.poll(() => slugsOf(page, "story-row")).toEqual(["slow-build", "unclear-owner"]);
  await expect(choices.getByRole("link", { name: "Ownership (2)" })).toHaveAttribute("aria-current", "true");
  await expect(storyRow(page, "slow-build").getByTestId("story-roles").getByRole("link")).toHaveText([
    "Software Engineer, Northwind Traders",
  ]);
  await expect(storyRow(page, "unclear-owner").getByTestId("story-roles").getByRole("link")).toHaveText([
    "Graduate Software Engineer, Harbour Bank (Search)",
    "Software Engineer, Northwind Traders",
  ]);
  await expectNoSidewaysScroll(page);

  await choices.getByRole("link", { name: "Learning from failure (1)" }).click();
  await expect(page).toHaveURL(/\/experience\?competency=learning-from-failure$/);
  await expect(page.getByTestId("story-row")).toHaveCount(1);
  await expect.poll(() => slugsOf(page, "story-row")).toEqual(["first-outage"]);

  await choices.getByRole("link", { name: "All (3)" }).click();
  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.getByTestId("story-row")).toHaveCount(3);
});

test("experience 10: read a story", async ({ page }) => {
  await page.goto("/experience");
  await storyRow(page, "unclear-owner").getByTestId("story-title").click();

  await expect(page).toHaveURL(/\/experience\/stories\/unclear-owner$/);
  await expect(page.getByRole("heading", { level: 1, name: "Unclear owner" })).toBeVisible();
  await expect(page.getByTestId("note-body")).toContainText("Two teams each thought that the other team owned");
  await expect(page.getByTestId("note-competencies").getByRole("link")).toHaveText(["Ownership", "Communication"]);
  const roles = page.getByTestId("note-roles").getByRole("link");
  await expect(roles).toHaveText([
    "Graduate Software Engineer, Harbour Bank (Search)",
    "Software Engineer, Northwind Traders",
  ]);
  await expectNoSidewaysScroll(page);

  await roles.first().click();
  await expect(page).toHaveURL(/\/experience\/roles\/harbour-search-rotation$/);
});

test("experience 11: read the skills inventory", async ({ page }) => {
  await page.goto("/experience/skills");

  const categories = page.getByTestId("skill-category");
  await expect(categories.getByRole("heading")).toHaveText(["Languages", "Tools", "Practices", "Not in the inventory"]);
  const languages = page.locator('[data-testid="skill-category"][data-category="Languages"]');
  await expect(languages.getByTestId("skill-row")).toHaveCount(3);
  await expect(languages.locator('[data-skill="typescript"]')).toContainText("TypeScript");
  await expect(languages.locator('[data-skill="typescript"]').getByTestId("skill-uses")).toHaveText("4 notes");
  await expect(page.locator('[data-skill="github-actions"]')).toContainText(
    "GitHub Actions (build pipelines and release pipelines)",
  );

  // The pinned skills are above the first category.
  const pinned = page.getByTestId("skills-pinned");
  await expect(pinned).toContainText("Backend Development · TypeScript");
  const pinnedBox = await pinned.boundingBox();
  const firstBox = await categories.first().boundingBox();
  expect(pinnedBox && firstBox && pinnedBox.y + pinnedBox.height <= firstBox.y).toBe(true);
  await expectNoSidewaysScroll(page);
});

test("experience 12: see where I used a skill", async ({ page }) => {
  // From the inventory.
  await page.goto("/experience/skills");
  await page.locator('[data-skill="typescript"]').getByRole("link").click();

  await expect(page).toHaveURL(/\/experience\/skills\/typescript$/);
  await expect(page.getByRole("heading", { level: 1, name: "TypeScript" })).toBeVisible();
  await expect(page.getByTestId("skill-category-name")).toContainText("Languages");
  // Each role and project that lists the skill, newest first.
  await expect
    .poll(() => slugsOf(page, "skill-note"))
    .toEqual(["recipe-box", "northwind-software-engineer", "open-maps", "tinker-studio-intern"]);
  const first = page.getByTestId("skill-note").first();
  await expect(first).toContainText("Recipe box");
  await expect(first).toContainText("Project");
  await expect(first).toContainText("Feb 2024 to present");
  await expectNoSidewaysScroll(page);

  // From a note.
  await page.goto("/experience/roles/harbour-payments-rotation");
  await page.getByTestId("note-skills").getByRole("link", { name: "Java" }).click();

  await expect(page).toHaveURL(/\/experience\/skills\/java$/);
  await expect.poll(() => slugsOf(page, "skill-note")).toEqual(["harbour-payments-rotation", "course-compiler"]);
  await page.getByTestId("skill-note").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/experience\/roles\/harbour-payments-rotation$/);
});

test("experience 13: notes that wait for an update stand out", async ({ page }) => {
  // A mark in the text of a note.
  await page.goto("/experience/roles/northwind-software-engineer");

  const body = page.getByTestId("note-body");
  const mark = body.getByTestId("revisit-mark");
  await expect(mark).toHaveCount(1);
  await expect(mark).toHaveText("Revisit");
  await expect(body.getByRole("listitem").filter({ has: page.getByTestId("revisit-mark") })).toContainText(
    "The count after the next audit is not known",
  );
  await expect(body).not.toContainText("#revisit");
  // The mark has a colour that the text around it does not have.
  const colours = await mark.evaluate((element) => [
    getComputedStyle(element).backgroundColor,
    getComputedStyle(element.parentElement as Element).backgroundColor,
  ]);
  expect(colours[0]).not.toBe(colours[1]);

  // A mark at a value in the facts of a note.
  await page.goto("/experience/projects/course-compiler");
  await expect(page.getByTestId("note-months").getByTestId("revisit-mark")).toHaveText(
    "Revisit: semester 2 exact months",
  );
  await expectNoSidewaysScroll(page);

  // A note with no mark.
  await page.goto("/experience/projects/recipe-box");
  await expect(page.getByTestId("revisit-mark")).toHaveCount(0);
});
