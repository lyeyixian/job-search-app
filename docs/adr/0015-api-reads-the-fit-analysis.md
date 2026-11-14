# ADR-0015: The API reads the fit analysis into data

**Status:** Accepted (2026-11-14)

## Context

The application page shows the requirements as a table with a grade for each row, makes each
piece of evidence a link to its achievement, and shows the bridging action of each gap. In the
vault, the fit analysis is markdown below the `## Fit analysis` heading of `posting.md`. The
requirements are a markdown table. The gaps are list items in most notes and a table in some.
Evidence names an achievement as `<note>#<achievement>`.

Options: Web draws the markdown as it is; Web reads the markdown; the API reads the markdown and
returns data.

## Decision

The API reads the fit analysis and returns data: the text of the verdict, the text of the
direction check, a list of requirements and a list of gaps. `apps/api/src/vault/fit.ts` holds
the reader. Text that stays markdown, such as the verdict, goes to Web as a markdown string.

The API finds the achievement that a piece of evidence names. The anchor of an achievement
follows the rule of the vault's resume tool: lower case, keep the letters, digits, spaces and
hyphens, then put a hyphen for each run of spaces.

## Consequences

- Web decides nothing from the text of a note. It gets a grade and a bridging action as values of
  a fixed list, so a badge needs no text match.
- The OpenAPI document shows the shape of a fit analysis.
- The reader accepts each form that the vault has now. A value that it cannot read is `null`,
  and text of the gaps that is not a gap goes to Web as a note, so the page loses no text.
- If the `/fit` skill changes the form of a fit analysis, the reader must change with it. The
  unit tests in `fit.test.ts` hold one case for each form.
- Evidence that names an achievement that does not exist is data, not an error. The page shows
  it as text with a mark.
