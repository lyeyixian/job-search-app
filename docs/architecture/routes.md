# Routes

The address of each page. Agreed on 14 Nov 2026.

| URL | Page | Feature file |
|---|---|---|
| `/` | Goes to `/applications` | [Every page](../features/every-page.md) |
| `/applications` | Application board | [Application board](../features/application-board.md) |
| `/applications/{slug}` | Application page | [Application page](../features/application-page.md) |
| `/shortlist` | Shortlist | [Shortlist](../features/shortlist.md) |
| `/companies` | List of companies | [Company listings](../features/company-listings.md) |
| `/companies/{company}` | Listings of one company | [Company listings](../features/company-listings.md) |
| `/companies/{company}/listings/{slug}` | One listing | [Company listings](../features/company-listings.md) |
| `/experience` | Profile, with lists of roles, projects and stories | [Experience](../features/experience.md) |
| `/experience/roles/{slug}` | A role note | [Experience](../features/experience.md) |
| `/experience/projects/{slug}` | A project note | [Experience](../features/experience.md) |
| `/experience/stories/{slug}` | A story | [Experience](../features/experience.md) |
| `/experience/skills` | Skills inventory | [Experience](../features/experience.md) |
| `/experience/skills/{skill}` | The roles and projects that list one skill | [Experience](../features/experience.md) |
| `/search` | Links to the direction, the targets and the companies | [Direction and targets](../features/direction-and-targets.md) |
| `/search/direction` | Direction | [Direction and targets](../features/direction-and-targets.md) |
| `/search/targets` | Targets | [Direction and targets](../features/direction-and-targets.md) |

## Rules

- A URL follows the folder of the note in the vault. A slug is the file name without `.md`, or the
  folder name for an application.
- An achievement is an anchor on its role page or project page:
  `/experience/roles/{slug}#{achievement}`.
- Filters live in the query string, as in `/applications?verdict=strong-fit`. Back then returns to the
  same filters, and a filtered view can be bookmarked.
- The API uses the same nouns under `/api`. The page `/applications/{slug}` reads from
  `/api/applications/{slug}`.
- A section of the direction or the targets is an anchor on its page: `/search/direction#{section}`.
- The menu has Applications, Shortlist, Experience and Search. Search is current on each page
  under `/search` and `/companies`.
- `/api/*` on Web forwards to the API. No page lives under `/api`. `/search` has no API endpoint,
  because the page holds only links.
