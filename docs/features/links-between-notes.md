# Links between notes

Notes in the vault name other notes. A story names its roles, an application names its listing,
and a fit analysis names achievements as evidence. In the app, each of those names is a link, so
you can follow a thought from one note to the next.

**As** the person who runs this job search,
**I want** each mention of a note to be a link to that note,
**so that** I can follow evidence and context without a search.

## Acceptance criteria

### 1. Follow a link in the text of a note

- **Given** the text of a note names a second note
- **When** I select the name
- **Then** I see the page of the second note

### 2. Follow a link in the facts of a note

- **Given** the facts at the top of a note name a role, a programme, a listing or an application
- **When** I select the name
- **Then** I see the page of that note

### 3. Land on the achievement

- **Given** a link names one achievement in a role note or a project note
- **When** I select the link
- **Then** the page opens at that achievement, and the achievement stands out for a moment

### 4. A link shows a readable name

- **Given** a note names a second note
- **When** I look at the link
- **Then** I see the title of the second note, or the text that the writer gave the link
- **And** I do not see the file name of the note

### 5. A link to nothing is visible

- **Given** a note names a note or an achievement that does not exist
- **When** I look at that name
- **Then** it shows as text with a mark that tells me the target is missing
- **And** I cannot select it

### 6. See what points to a note

- **Given** other notes name the note that I am reading
- **When** I look at the end of the page
- **Then** I see a list of those notes, grouped by kind

### 7. Go back

- **Given** I followed a link
- **When** I go back
- **Then** I see the page that I came from, at the place where I was

### 8. A link to the outside opens in a new tab

- **Given** a note has a link to a website
- **When** I select it
- **Then** the website opens in a new tab, and the app stays open

## Assumptions

- A name of a note is unique in the vault, apart from listings. A listing is unique in its
  company.
- If you rename an achievement, the names that point to it stop working until you correct them.

## Decisions

- **A missing target is shown, not hidden.** A broken reference in a fit analysis or a resume is a
  mistake that you want to find.
- **The app shows what points to a note.** This is how you see which applications use an
  achievement as evidence.
- **Links to the journal stay as text.** The journal is not in this version.
