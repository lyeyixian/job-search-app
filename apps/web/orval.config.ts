import { defineConfig } from "orval";

// Writes the typed API client from the committed OpenAPI document. Run `pnpm openapi`.
export default defineConfig({
  api: {
    input: "../../docs/api/openapi.json",
    output: {
      target: "src/api/generated.ts",
      client: "fetch",
      mode: "single",
      override: {
        mutator: { path: "src/api/fetcher.ts", name: "apiFetch" },
      },
    },
  },
});
