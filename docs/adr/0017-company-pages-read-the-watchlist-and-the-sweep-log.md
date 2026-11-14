# ADR-0017: The company pages read the watchlist and the sweep log

**Status:** Accepted (2026-11-14)

## Context

The company listings pages show three things that are not rows of a company index: what the
watchlist says about the company, the day of each sweep, and the full text of one listing.

`search/market/watchlist.md` has one `##` section for each company, with the list items `board`,
`recipe`, `rendering`, `quirks`, `comp`, `remote`, `last-swept` and `mode`. A person writes this
file. An item can continue on the next lines, and `quirks` is often a list. The heading is the
name of the company, and it does not always give the name of the folder. One heading has two
names with `/` between them.

`search/market/<company>/index.md` has a `## Sweep log` section below the table. Each line starts
with the day of a sweep in bold, and the remainder of the line is the instructions and the counts
of that sweep.

The feature file says that the instructions for a sweep stay out of the page.

Options for the companies in the list: each company with a listing index; each company on the
watchlist; both.

## Decision

The list of companies is each company that has a listing index. The API then finds its watchlist
entry. An entry matches if its heading is the name in the index, or if the slug of the heading,
or of one part of a heading with `/`, is the name of the folder.

`apps/api/src/vault/companies.ts` reads the watchlist items by their keys. The response has
`mode`, `last-swept`, the first web address of `board`, and `quirks`, `comp` and `remote` as
markdown. The response does not have `recipe` or `rendering`.

The API reads only the day of each line of the sweep log.

The page of one listing joins the listing record with its row in the company index. The record
gives the title, the region, the level, the first day and the text. The row gives the triage, the
reason, the last day, the state and the application.

A row of a company index can write its link with a path. The slug of the listing is the file
name.

The API returns each listing of a company in one response. Web hides the rejected listings, and
the choice to show them is in the query string of the page.

## Consequences

- A company that is on the watchlist and has no sweep is not in the app.
- A company with an index and no watchlist entry shows with no mode. Its last sweep is the newest
  day of its sweep log.
- The instructions for a sweep do not leave the API, so a change to the page cannot show them.
- If the `/scan` skill changes the keys of the watchlist or the form of a sweep log line, the
  reader must change with it. The unit tests in `companies.test.ts` hold the cases.
- The largest company has about 190 listings, so one response for each company is small.
