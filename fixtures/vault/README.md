# Fixture vault

A made-up vault for tests and local runs. Every person, company and job here is invented. The
notes follow the frontmatter schema of the real vault.

The applications cover each status except `offer`. The `offer` column of the board stays empty,
so that a test can check an empty column. Each `resume.pdf` is the same one-page placeholder.

Some notes are wrong on purpose, so that a test has a case to check:

| Note | Case |
|---|---|
| `applications/harbor-data-software-engineer/posting.md` | The required key `verdict` is missing |
| `search/market/example-co/data-engineer-1004.md` | `region` has a value that the schema does not permit |
| `experience/stories/slow-build.md` | A link to a note that does not exist |
| `experience/stories/slow-build.md` | A link to an achievement that does not exist |
