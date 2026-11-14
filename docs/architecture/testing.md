# Testing

How the code is tested, and how a test maps to the spec. See
[ADR-0011](../adr/0011-three-test-layers.md).

| Layer | Tool | Tests | Runs against | Lives in |
|---|---|---|---|---|
| Unit | Vitest | The parser, the schema check, the link resolver, the queries | Files in `fixtures/vault/` | `apps/api/src/vault/` next to the code |
| API | Vitest | Each endpoint: status codes, and the response against its Zod schema | The API in-process, no network | `apps/api/src/http/` next to the code |
| Browser | Playwright | Each acceptance criterion in the spec | Both services, a real browser | `apps/web/e2e/` |

## From a criterion to a test

Each numbered criterion in a feature file has one Playwright test with the same name.

```text
docs/features/application-board.md
  ### 2. Finished applications stay out of the way

apps/web/e2e/application-board.spec.ts
  test("application-board 2: finished applications stay out of the way", ...)
```

- One spec file per feature file, with the same name.
- The test title starts with the feature name and the criterion number.
- The criteria in [Every page](../features/every-page.md) have their own spec file.
- Each test runs at a desktop size and a phone size.
- A criterion that cannot be tested in a browser says so in a skipped test with the reason.

## The fixture vault

`fixtures/vault/` is a small made-up vault that follows the vault's schema. It holds no real data.
It has at least one note for each case that a criterion names:

- an application in each status, with and without a tailored resume
- a note with a missing field and a note with a value that the schema does not permit
- a link to a note that does not exist, and a link to an achievement that does not exist
- a company with open, closed, rejected and promoted listings
