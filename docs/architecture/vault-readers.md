# Vault readers

How the API reads the notes of the market scan and of the experience. Each reader is a file in
`apps/api/src/vault/`. A reader changes with the form of the notes that a skill or a person
writes. The reasons for the larger choices are in
[ADR-0015](../adr/0015-api-reads-the-fit-analysis.md) and
[ADR-0016](../adr/0016-shortlist-from-the-company-indexes.md).

## Company pages

`companies.ts` reads the watchlist, the company indexes and the listing records.

| Source | What the reader takes |
|---|---|
| `search/market/<company>/index.md`, the table | One row for each listing: the triage, the reason, the last day, the state and the application |
| `search/market/<company>/index.md`, `## Sweep log` | The day at the start of each line. The remainder of the line holds the instructions of the sweep, and the reader drops it. |
| `search/market/watchlist.md`, one `##` section for each company | `mode`, `last-swept`, the first web address of `board`, and `quirks`, `comp` and `remote` as markdown. The reader drops `recipe` and `rendering`. |
| The listing record | The title, the region, the level, the first day and the text |

- The list of companies is each company that has a listing index.
- A watchlist entry matches a company if its heading is the name in the index. It also matches if
  the slug of the heading, or of one part of a heading with `/`, is the name of the folder.
- A company with an index and no watchlist entry has no mode. Its last sweep is the newest day of
  its sweep log.
- An item of the watchlist can continue on the next lines. `quirks` is often a list.
- A row of a company index can write its link with a path. The slug of the listing is the file
  name.
- The page of one listing joins the listing record with its row in the company index.
- The API returns each listing of a company in one response. The largest company has about 190
  listings. Web hides the rejected listings.
- The unit tests in `companies.test.ts` hold the cases. If the `/scan` skill changes the keys of
  the watchlist or the form of a sweep log line, change the reader and the tests.

## Experience pages

`experience.ts` reads the role notes, the project notes, the stories, the profile and the skills
inventory.

- The title of a note is its first `#` heading. If the note has none, a role note gets
  `<job title>, <company> (<team>)`. Each other note gets its slug as words: `slow-build` becomes
  `Slow build`.
- The list of roles is newest first, by the start month.
- A stint names its programme with the key `programme`. A role note that other notes name as
  their programme holds those notes as its stints, and the stints are not in the list of roles.
  The programme has the place of its newest stint. If no role note has the slug of the
  programme, the stint stays in the list.
- `experience/skills.md` has one `##` section for each category. The section whose heading starts
  with `Pinned` goes to the page as markdown. In each other section, a list item that starts
  with a slug in code marks is a skill, and its name can continue on the next line.
- The API counts the role notes and the project notes that list each skill. A skill that a note
  lists and the inventory does not have is in a list of its own, with its slug as the name.
- One skill has its own endpoint. It returns each role note and project note that lists the
  skill, newest first.
- A story has no achievements, so a reference to an achievement finds only a role note or a
  project note.
- The API returns each story in one response. Web narrows the stories by competency.
- The unit tests in `experience.test.ts` hold the cases. If the form of a skill item or the name
  of the `Pinned` section changes, change the reader and the tests.

## The `#revisit` tag

The tag `#revisit` marks a text that waits for an update.

- A tag in the text of a note stays in the markdown. The markdown component of Web puts a mark
  in its place. That component shows each note, so a tag in an application or a listing gets the
  same mark.
- A tag can be in a YAML comment on a frontmatter line. The YAML parser drops comments, so the
  parser of a note keeps each frontmatter key whose line has a comment with `#revisit`, with the
  text of the comment.
- Web shows a mark at the months of the note for the keys `start` and `end`. A comment on a
  different key is in the response of the API, and no page shows it.
