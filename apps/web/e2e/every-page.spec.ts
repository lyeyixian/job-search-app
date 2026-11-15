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
