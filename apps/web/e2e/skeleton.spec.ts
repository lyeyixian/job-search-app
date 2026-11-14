import { expect, test } from "@playwright/test";

// These tests cover the skeleton, not a criterion of the feature spec.
// The first feature replaces them with one spec file per feature file.

test("skeleton 1: the home page shows that the API answers", async ({ page }) => {
  await page.goto("/");

  const status = page.getByTestId("api-status");
  await expect(status).toContainText("API ok");
  expect(Number(await page.getByTestId("note-count").textContent())).toBeGreaterThan(0);
});

test("skeleton 2: Web forwards /api/* to the API", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect((await health.json()).status).toBe("ok");

  const missing = await request.get("/api/no-such-route");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"]).toContain("application/problem+json");
  expect((await missing.json()).code).toBe("route_not_found");
});

test("skeleton 3: the API docs page opens through Web", async ({ page }) => {
  await page.goto("/api/docs");

  await expect(page).toHaveTitle("Job search API");
});
