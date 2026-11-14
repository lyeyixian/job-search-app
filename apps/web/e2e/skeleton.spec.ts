import { expect, test } from "@playwright/test";

// These tests cover the skeleton, not a criterion of the feature spec.

test("skeleton 1: Web forwards /api/* to the API", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect((await health.json()).status).toBe("ok");

  const missing = await request.get("/api/no-such-route");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"]).toContain("application/problem+json");
  expect((await missing.json()).code).toBe("route_not_found");
});

test("skeleton 2: the API docs page opens through Web", async ({ page }) => {
  await page.goto("/api/docs");

  await expect(page).toHaveTitle("Job search API");
});
