# ADR-0011: Three test layers, with one browser test per acceptance criterion

**Status:** Accepted (2026-11-14)

## Context

The feature spec has about 60 numbered acceptance criteria in Given, When, Then form. Most are
about what the person sees on a page, and many apply to a phone. Agents will write much of the
code and need a clear signal that a feature is done.

Options: three layers with browser tests, or unit and API tests only with the pages checked by
hand.

## Decision

Three layers, all against the made-up vault in `fixtures/vault/`.

1. Vitest unit tests for the vault module.
2. Vitest API tests that run each endpoint in-process and check the response against its schema.
3. Playwright tests, one per acceptance criterion, at a desktop size and a phone size.

A Playwright test carries the name of its feature file and the number of its criterion.

## Consequences

- A feature is done when the tests for its criteria pass.
- A criterion with no test is visible, because the names match the spec.
- A change to a criterion in the spec means a change to its test in the same pull request.
- The fixture vault must hold a note for each case that a criterion names, such as a note with a
  bad field and a link to a missing achievement.
- Browser tests make the pull request checks slower.
