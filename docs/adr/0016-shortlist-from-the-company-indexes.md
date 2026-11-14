# ADR-0016: The shortlist comes from the company indexes

**Status:** Accepted (2026-11-14)

## Context

The market scan holds the triage of a listing in two places. `search/market/<company>/index.md`
has one row for each listing of the company, with its triage, its state and its application.
`search/market/shortlist.md` has the open shortlisted listings of all companies. The `/scan`
skill writes `shortlist.md` again from the company indexes, and a change that a person makes to
it is lost.

The shortlist page needs the open listings with the triage `shortlist`. The company listings
pages need each row of one company index.

Options: read `shortlist.md`; read each company index; put the market scan in a database.

## Decision

The API reads the table of each company index and keeps the rows that are open and have the
triage `shortlist`. It does not read `shortlist.md`. `apps/api/src/vault/shortlist.ts` holds the
reader, and `apps/api/src/vault/table.ts` holds the table reader that it shares with the fit
analysis.

The name of a company is the heading of its index, without ` - listing index`. The title of a
listing is the label of the link in the `Listing` column. The status of a promoted listing comes
from the application that the `Application` column names.

The market scan stays as files in the vault. The index holds about 860 rows in memory.

## Consequences

- The shortlist and the company listings pages read the same rows, so they cannot disagree.
- A triage that a person changes in a company index shows on the shortlist after the next
  update from the vault, before `/scan` runs again.
- The API sorts the rows. It does not use the row order of a file.
- A row with a day that is not a day shows with a warning. A row with a triage or a state that
  the rules do not permit is not on the shortlist.
- If the `/scan` skill changes the columns of a company index, the reader must change with it.
  The unit tests in `shortlist.test.ts` hold the cases.
- `shortlist.md` has no reader in the app.
