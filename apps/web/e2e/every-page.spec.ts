import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

// The tests for the criteria of docs/features/every-page.md, with the same names.
// The data is the made-up vault in fixtures/vault/.

type Choice = {
  start: string;
  choose: (page: Page) => Promise<unknown>;
  address: RegExp;
  check: (page: Page) => Promise<void>;
};

const choices: Record<string, Choice> = {
  "the application board": {
    start: "/applications",
    choose: (page) => page.getByTestId("board-filters").getByLabel("Company").selectOption("Example Co"),
    address: /\/applications\?company=Example\+Co$/,
    check: async (page) => {
      await expect(page.getByTestId("board-filters").getByLabel("Company")).toHaveValue("Example Co");
      await expect(page.getByTestId("application-card")).toHaveCount(2);
    },
  },
  "the shortlist": {
    start: "/shortlist",
    choose: (page) => page.getByLabel("Company").selectOption("kestrel-pay"),
    address: /\/shortlist\?company=kestrel-pay$/,
    check: async (page) => {
      await expect(page.getByLabel("Company")).toHaveValue("kestrel-pay");
      await expect(page.getByTestId("shortlist-row")).toHaveCount(3);
    },
  },
  "the listings of a company": {
    start: "/companies/kestrel-pay",
    choose: (page) => page.getByRole("link", { name: "Show rejected listings" }).click(),
    address: /\/companies\/kestrel-pay\?rejected=show$/,
    check: async (page) => {
      await expect(page.getByTestId("listing-row")).toHaveCount(5);
    },
  },
  "the stories": {
    start: "/experience",
    choose: (page) => page.getByTestId("competency-choices").getByRole("link", { name: "Ownership (2)" }).click(),
    address: /\/experience\?competency=ownership$/,
    check: async (page) => {
      await expect(page.getByTestId("story-row")).toHaveCount(2);
    },
  },
};

// One page of each kind.
const pages = [
  "/applications",
  "/applications/example-co-backend-engineer",
  "/shortlist",
  "/companies",
  "/companies/example-co",
  "/companies/example-co/listings/backend-engineer-1001",
  "/experience",
  "/experience/roles/northwind-software-engineer",
  "/experience/skills",
  "/experience/skills/typescript",
  "/search",
  "/search/direction",
  "/search/targets",
];

const fixtureVault = join(__dirname, "../../../fixtures/vault");

/** One hash of the name and the content of each file of the vault. */
function vaultHash(): string {
  const hash = createHash("sha256");
  const files = readdirSync(fixtureVault, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
  for (const file of files) hash.update(file).update(readFileSync(file));
  return hash.digest("hex");
}

/** The time of the last update from the vault, as the page has it. */
function vaultTime(page: Page) {
  return page.getByTestId("vault-status").getByRole("time");
}

test("every-page 1: go to each feature from each page", async ({ page }) => {
  for (const start of pages) {
    await page.goto(start);
    // The menu is at the top of the page.
    const menu = page.getByRole("navigation", { name: "Menu" });
    await expect(menu.getByRole("link")).toHaveText(["Applications", "Shortlist", "Experience", "Search"]);
    expect((await menu.boundingBox())?.y).toBeLessThan(60);
  }

  // One selection goes to each of them.
  const menu = page.getByRole("navigation", { name: "Menu" });
  const items = [
    { name: "Applications", address: /\/applications$/ },
    { name: "Shortlist", address: /\/shortlist$/ },
    { name: "Experience", address: /\/experience$/ },
    { name: "Search", address: /\/search$/ },
  ];
  for (const { name, address } of items) {
    await menu.getByRole("link", { name }).click();
    await expect(page).toHaveURL(address);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    // The menu marks the part of the app that the page is in.
    await expect(menu.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  }
});

test("every-page 2: the app changes nothing", async ({ page }) => {
  const before = vaultHash();

  // Select, filter and open something in each feature.
  await page.goto("/applications");
  await page.getByTestId("board-filters").getByLabel("Company").selectOption("Example Co");
  await expect(page.getByTestId("application-card")).toHaveCount(2);
  await page.getByTestId("application-card").first().click();
  await expect(page).toHaveURL(/\/applications\/example-co-/);
  await page.goto("/shortlist");
  await page.getByLabel("Company").selectOption("kestrel-pay");
  await expect(page.getByTestId("shortlist-row")).toHaveCount(3);
  await page.goto("/companies/kestrel-pay");
  await page.getByRole("link", { name: "Show rejected listings" }).click();
  await expect(page.getByTestId("listing-row")).toHaveCount(5);
  await page.goto("/experience");
  await page.getByTestId("competency-choices").getByRole("link", { name: "Ownership (2)" }).click();
  await expect(page.getByTestId("story-row")).toHaveCount(2);
  for (const address of pages) await page.goto(address);

  // Refresh gets the vault. It does not change it.
  const old = await vaultTime(page).getAttribute("datetime");
  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(vaultTime(page)).not.toHaveAttribute("datetime", old ?? "");

  expect(vaultHash()).toBe(before);
});

test("every-page 3: open the app with no sign-in", async ({ page }) => {
  await page.goto("/");

  // The address of the app opens the application board.
  await expect(page).toHaveURL(/\/applications$/);
  await expect(page.getByRole("heading", { level: 1, name: "Applications" })).toBeVisible();
  await expect(page.getByTestId("application-card").first()).toBeVisible();

  // The app does not ask for a sign-in.
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await expect(page.getByText(/sign in|log in/i)).toHaveCount(0);
});

test("every-page 4: other devices cannot open the app", () => {
  test.skip(
    true,
    "A browser test cannot do this. The network decides which devices reach the app: Web listens only on the server itself, and Tailscale lets only the devices of the tailnet in. The check is in docs/architecture/server-runbook.md.",
  );
});

test("every-page 5: use each page on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "This criterion is about a phone. The phone project runs it.");

  for (const address of pages) {
    await test.step(address, async () => {
      await page.goto(address);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(vaultTime(page)).not.toBeEmpty();

      const { smallest, pageWidth, screenWidth, scale } = await page.evaluate(() => {
        // The smallest text of the page, from each element that holds text of its own.
        let smallest = { size: Number.POSITIVE_INFINITY, text: "" };
        for (const element of document.body.querySelectorAll("*")) {
          const own = [...element.childNodes].some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          );
          if (!own || !(element as HTMLElement).checkVisibility?.()) continue;
          const size = Number.parseFloat(getComputedStyle(element).fontSize);
          if (size < smallest.size) smallest = { size, text: element.textContent?.trim().slice(0, 40) ?? "" };
        }
        return {
          smallest,
          pageWidth: document.documentElement.scrollWidth,
          screenWidth: document.documentElement.clientWidth,
          scale: window.visualViewport?.scale ?? 1,
        };
      });

      // The page has the width of the phone, with no zoom, and its smallest text is 11 pixels or more.
      expect(scale).toBe(1);
      expect(smallest.size, `the text "${smallest.text}"`).toBeGreaterThanOrEqual(11);
      // The page does not scroll sideways. The board and a wide table scroll inside the page.
      expect(pageWidth).toBeLessThanOrEqual(screenWidth);
    });
  }
});

test("every-page 6: know how fresh the data is", async ({ page }) => {
  for (const address of pages) {
    await page.goto(address);
    await expect(page.getByTestId("vault-status")).toContainText("Vault updated");
    // The time shows in the time zone of the device, with the day.
    await expect(vaultTime(page)).toHaveText(/^\d{1,2} \w{3} \d{4}, \d{2}:\d{2}:\d{2}$/);
  }

  const old = await vaultTime(page).getAttribute("datetime");
  await page.getByRole("button", { name: "Refresh" }).click();

  // The page shows the new time.
  await expect(vaultTime(page)).not.toHaveAttribute("datetime", old ?? "");
  const fresh = await vaultTime(page).getAttribute("datetime");
  expect(Date.parse(fresh ?? "")).toBeGreaterThan(Date.parse(old ?? ""));
  await expect(page.getByRole("button", { name: "Refresh" })).toBeEnabled();
  await expect(page.getByTestId("refresh-failed")).toHaveCount(0);

  // If the app cannot get the vault, the page shows the error and the old time.
  await page.route("**/api/refresh", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/problem+json",
      body: JSON.stringify({ code: "vault_pull_failed" }),
    }),
  );
  await page.getByRole("button", { name: "Refresh" }).click();
  const banner = page.getByTestId("refresh-failed");
  await expect(banner).toContainText("The app could not get the newest vault. The data is from");
  await expect(banner.getByRole("time")).toHaveAttribute("datetime", fresh ?? "");
  await expect(vaultTime(page)).toHaveAttribute("datetime", fresh ?? "");
});

test("every-page 7: a note with a mistake does not stop the app", async ({ page }) => {
  // The status of the application of Birchwood Labs is `phoned`, which the rules do not permit.
  await page.goto("/applications");
  const cards = page.getByTestId("application-card");
  await expect(cards.filter({ hasText: "Birchwood Labs" }).getByTestId("card-warnings")).toContainText(
    "The note has a status that the vault's rules do not permit.",
  );
  // The other applications show as usual. An application with no mistake has no warning.
  const usual = cards.filter({ hasNot: page.getByTestId("card-warnings") });
  await expect(usual.filter({ hasText: "Example Co" })).toHaveCount(2);
  expect(await usual.count()).toBeGreaterThan(5);

  // The project note `course-compiler` has a link that is not a web address.
  await page.goto("/experience/projects/course-compiler");
  await expect(page.getByRole("heading", { level: 1, name: "Course compiler" })).toBeVisible();
  await expect(page.getByTestId("note-warnings")).toHaveText(
    "Warning: The note has a link that the vault's rules do not permit.",
  );
  await expect(page.getByTestId("note-months")).toContainText("2020");
  // A note with no mistake has no warning.
  await page.goto("/experience/projects/recipe-box");
  await expect(page.getByRole("heading", { level: 1, name: "Recipe box" })).toBeVisible();
  await expect(page.getByTestId("note-warnings").filter({ visible: true })).toHaveCount(0);

  // The listing record `sales-engineer-4002` has no `board-id`.
  await page.goto("/companies/marlow-freight/listings/sales-engineer-4002");
  await expect(page.getByRole("heading", { level: 1, name: "Sales Engineer" })).toBeVisible();
  await expect(page.getByTestId("note-warnings").filter({ visible: true })).toHaveText(
    "Warning: The note has no board-id.",
  );
  await expect(page.getByTestId("listing-facts").filter({ visible: true })).toBeVisible();
});

test("every-page 8: my choices stay with the page", async ({ page, context }) => {
  for (const [name, { start, choose, address, check }] of Object.entries(choices)) {
    await test.step(name, async () => {
      await page.goto(start);
      await choose(page);
      await expect(page).toHaveURL(address);
      await check(page);

      // Go to a different page, and then go back.
      await page.goto("/experience/skills");
      await expect(page.getByRole("heading", { level: 1, name: "Skills inventory" })).toBeVisible();
      await page.goBack();
      await expect(page).toHaveURL(address);
      await check(page);

      // A bookmark is the address of the page, opened in a new tab.
      const bookmark = await context.newPage();
      await bookmark.goto(page.url());
      await check(bookmark);
      await bookmark.close();
    });
  }
});
