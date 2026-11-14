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

- an application in each status except `offer`, with and without a tailored resume. No
  application has the status `offer`, because a criterion of the board needs an empty column.
- a note with a missing field and a note with a value that the schema does not permit
- a link to a note that does not exist, and a link to an achievement that does not exist
- an application with a link to the posting, a source listing, each grade and each bridging
  action, and an application with none of these
- an application with no fit analysis, and a fit analysis that writes its gaps as a table
- a company with open, closed, rejected and promoted listings
- three companies with shortlisted listings, one of them with listings first seen on different
  days, and a company with no shortlisted listing
- a closed listing with the triage `shortlist`
- a listing with the state `unknown`, and a sweep log with more than one day for each company
  but one
- a watchlist entry with notes on more than one line, and a company with the mode `watch`
- a current role, a programme with two stints, and role notes with and without a `#` heading
- a project of three kinds, one that cannot go on a resume, and one with no link
- three stories with different competencies, one of them from two roles
- a skills inventory with a `Pinned` section and a name on two lines, and a skill that a note
  lists and the inventory does not have
- a `#revisit` tag in the text of a note, and one in a comment of the frontmatter
