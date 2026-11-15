# Fixture vault

A made-up vault for tests and local runs. Every person, company and job here is invented. The
notes follow the frontmatter schema of the real vault.

The applications cover each status except `offer`. The `offer` column of the board stays empty,
so that a test can check an empty column. Each `resume.pdf` is the same one-page placeholder.

Some notes are wrong on purpose, so that a test has a case to check:

| Note | Case |
|---|---|
| `applications/harbor-data-software-engineer/posting.md` | The required key `verdict` is missing |
| `applications/birchwood-labs-software-engineer/posting.md` | `status` has a value that the schema does not permit, and the note has no verdict |
| `search/market/example-co/data-engineer-1004.md` | `region` has a value that the schema does not permit |
| `experience/stories/slow-build.md` | A link to a note that does not exist |
| `experience/stories/slow-build.md` | A link to an achievement that does not exist |
| `experience/stories/slow-build.md` | The role `retired-role` in `roles`, which no role note has |
| `experience/roles/tinker-studio-intern.md` | The programme `tinker-summer-scheme`, which no role note has |
| `applications/example-co-backend-engineer/posting.md` | Evidence that names an achievement that does not exist, `on-call-rota` |

The applications also cover the cases of the application page:

| Note | Case |
|---|---|
| `applications/example-co-backend-engineer/posting.md` | A link to the posting, a source listing, a resume, each grade, and a gap of each bridging action |
| `applications/pine-street-backend-engineer/posting.md` | No link, no source listing, no resume and no gaps |
| `applications/quill-works-full-stack-engineer/posting.md` | The gaps as a table |
| `applications/harbor-data-software-engineer/posting.md` | No fit analysis |
| `applications/lumen-labs-platform-engineer/posting.md` | A gap that names no bridging action |

The market scan covers the cases of the shortlist:

| Note | Case |
|---|---|
| `search/market/example-co/index.md` | Two shortlisted listings first seen on the same day, one promoted |
| `search/market/kestrel-pay/index.md` | Shortlisted listings first seen on three days, a closed listing with the triage `shortlist`, and a rejected listing |
| `search/market/orchard-robotics/index.md` | Each shortlisted listing is promoted, and a listing with the triage `maybe` |
| `search/market/marlow-freight/index.md` | No shortlisted listing |

The market scan also covers the cases of the company listings pages:

| Note | Case |
|---|---|
| `search/market/watchlist.md` | Notes on more than one line for Example Co, a web address with text after it, and the mode `watch` for Marlow Freight |
| `search/market/example-co/index.md` | A sweep log with three days, and a closed listing with the triage `maybe` |
| `search/market/orchard-robotics/index.md` | A listing with the state `unknown` |
| `search/market/marlow-freight/index.md` | A sweep log with one day |

The experience notes cover the cases of the experience pages:

| Note | Case |
|---|---|
| `experience/roles/northwind-software-engineer.md` | The current role, a `#` heading, two achievements, and a `#revisit` tag in the text |
| `experience/roles/harbour-graduate-programme.md` | A programme with two stints, and no `#` heading |
| `experience/projects/course-compiler.md` | A project that cannot go on a resume, no link, and a `#revisit` tag in a comment of the frontmatter |
| `experience/projects/open-maps.md` | A skill that the skills inventory does not have, `rust` |
| `experience/stories/unclear-owner.md` | A story from two roles, and no `#` heading |
| `experience/skills.md` | A `Pinned` section, a name on two lines, and a skill that no note lists |

The notes also cover the cases of the links between notes:

| Note | Case |
|---|---|
| `experience/stories/slow-build.md` | A link to an achievement, a link with a label, a link to an application, a link to a listing, a link to a journal file, and a link to a website |
| `experience/profile.md` | A link to a role note |
| `applications/example-co-backend-engineer/posting.md` | A link in the verdict, and a link with a label in a gap |
| `experience/journal/2026-10-01.md` | A journal file, which has no page in the app |
