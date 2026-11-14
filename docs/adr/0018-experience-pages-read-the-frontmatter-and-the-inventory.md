# ADR-0018: The experience pages read the frontmatter and the skills inventory

**Status:** Accepted (2026-11-14)

## Context

The experience pages show the profile, the role notes, the project notes, the stories and the
skills inventory. The facts of a role note, a project note and a story are in the frontmatter.
The profile and the skills inventory are text that a person writes.

Four things are not in the frontmatter in a form that a page can show:

- Most notes have no `#` heading, so a note has no title. A role note has a job title and a
  company. A project note and a story have only a file name.
- A stint of a programme names the programme with the key `programme`. The role note of the
  programme does not name its stints. The stints of one programme have the same job title and
  the same company.
- `experience/skills.md` has one `##` section for each category. A skill is a list item that
  starts with the slug in code marks, and its name can continue on the next line. The `Pinned`
  section is free text, not a list of slugs.
- The tag `#revisit` marks a text that waits for an update. Some tags are in the text of a note.
  Some are in a YAML comment on a frontmatter line, and the YAML parser drops comments.

Options for the title: add a `title` key to each note in the vault; make a title from what the
note has.

Options for a skill that a note lists and the inventory does not have: hide it; show it with its
slug as the name.

## Decision

`apps/api/src/vault/experience.ts` reads the experience notes.

The title of a note is its first `#` heading. If the note has none, a role note gets
`<job title>, <company> (<team>)`, and each other note gets its slug as words: `slow-build`
becomes `Slow build`. The vault does not change.

The list of roles is newest first, by the start month. A role note that other notes name as
their programme holds those notes as its stints, and the stints are not in the list. The
programme has the place of its newest stint. If no role note has the slug of the programme, the
stint stays in the list.

The API reads the skills inventory by its sections. The section whose heading starts with
`Pinned` goes to the page as markdown. In each other section, a list item that starts with a
slug in code marks is a skill. The API counts the role notes and the project notes that list
each skill. A skill that a note lists and the inventory does not have is in a list of its own,
with its slug as the name.

One skill has its own address, `/experience/skills/{skill}`, and its own endpoint. The page
shows each role note and project note that lists the skill, newest first.

The parser of a note keeps each frontmatter key whose line has a comment with `#revisit`, with
the text of the comment. Web shows a mark at the months of the note for the keys `start` and
`end`. A tag in the text of a note stays in the markdown, and the markdown component of Web
puts a mark in its place. That component shows each note, so a tag in an application or a
listing gets the same mark.

A story has no achievements, so a reference to an achievement finds only a role note or a
project note.

The choice of a competency is in the query string of `/experience`. Web narrows the stories.
The API returns each story in one response.

## Consequences

- A project note or a story shows a title made from its file name. `cs3203-spa` shows as
  `Cs3203 spa`. A `#` heading in the note gives it a better title, with no change to the app.
- A skill slug with a typing error shows under "Not in the inventory", so the person can find it.
- If the form of a skill item or the name of the `Pinned` section changes, the reader must
  change with it. The unit tests in `experience.test.ts` hold the cases.
- A `#revisit` comment on a frontmatter key other than `start` and `end` is in the response of
  the API, and no page shows it yet.
- The vault has about 10 notes of each kind, so one response for the overview is small.
