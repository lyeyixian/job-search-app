// Writes docs/api/openapi.json from the routes and the Zod schemas.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createApp, openApiInfo } from "../src/http/app.js";
import { VaultStore } from "../src/vault/store.js";

const target = fileURLToPath(new URL("../../../docs/api/openapi.json", import.meta.url));
const document = createApp(new VaultStore("")).getOpenAPI31Document(openApiInfo);

await writeFile(target, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Wrote ${target}`);
