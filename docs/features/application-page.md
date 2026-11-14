# Application page

The application page shows all that the vault holds about one application: the facts about it,
the posting, the fit analysis and the tailored resume. You use it to decide if you will apply, and
to prepare when you do.

**As** the person who runs this job search,
**I want** to read the posting, the fit analysis and the tailored resume of one application in one
place,
**so that** I can decide what to do with the application and prepare for it.

## Acceptance criteria

### 1. See the facts of the application

- **Given** I open the page of an application
- **When** I look at the top of the page
- **Then** I see the company, the title, the region and the status
- **And** I see the verdict, the direction check, the day it was captured and the day of the last
  fit analysis

### 2. Open the posting on the job board

- **Given** the application has a link to the posting on the job board
- **When** I select the link
- **Then** the job board opens in a new tab
- **Given** the application has no link
- **When** I look at the top of the page
- **Then** the page shows no link and no empty space for one

### 3. Read the posting and the fit analysis as two parts

- **Given** I am on the page of an application
- **When** I look at the page
- **Then** the posting and the fit analysis are two separate parts
- **And** I can go to each part with one selection, without scrolling through the other part

### 4. The fit analysis comes first

- **Given** the application has a fit analysis
- **When** I open the page
- **Then** I see the fit analysis before the posting

### 5. Read the requirements table

- **Given** the fit analysis has a requirements table
- **When** I look at the table
- **Then** each requirement shows its kind, its firmness, its grade and its evidence
- **And** I can tell the grades `met`, `partial` and `gap` apart at a glance
- **When** I look at the table on my phone
- **Then** I can read each requirement in full

### 6. Go from evidence to the achievement

- **Given** a requirement names an achievement as evidence
- **When** I select the evidence
- **Then** I see that achievement in its role note or project note

### 7. Read the gaps

- **Given** the fit analysis lists gaps
- **When** I look at the gaps
- **Then** each gap shows its bridging action, `positioning` or `learning`

### 8. See the tailored resume

- **Given** the application has a tailored resume
- **When** I go to the resume part of the page
- **Then** I see the resume as it prints
- **And** I can download it
- **Given** the application has no tailored resume
- **When** I go to the resume part of the page
- **Then** the page tells me that no resume exists yet

### 9. Go to the listing that the application came from

- **Given** I promoted the application from a listing
- **When** I look at the top of the page
- **Then** I see a link to that listing

### 10. Go back to the board

- **Given** I came to the page from the board with filters set
- **When** I go back
- **Then** the board shows the same filters

## Assumptions

- You do not change the posting or the fit analysis by hand. You change only the tailored resume.
- A fit analysis always has the same four parts: the verdict, the direction check, the
  requirements table and the gaps.
- Evidence names an achievement as `<note>#<achievement>`. Evidence that names an achievement
  that does not exist shows as text with a mark, and you cannot select it.
- A gap that names no bridging action says so.
- The page of a role note or a project note is a plain view until the experience feature is
  built. It shows the note, and it opens at the achievement.
- The link to the listing goes to the page of that listing. That page does not exist until the
  company listings feature is built.

## Decisions

- **The fit analysis comes before the posting.** The fit analysis is what you act on. The posting
  is long, and you read it less often.
- **The parts are tabs.** The fit analysis, the posting and the resume are three tabs. One tab
  shows at a time, so you do not scroll through a part to get to the next one. An application
  with no fit analysis opens at the posting.
- **On a phone, a requirement is a card.** A table with five columns does not fit a phone. Each
  requirement shows as a card, and each value has the name of its column.
- **The link back keeps the filters.** "Back to the board" goes to the board with the filters
  that you set last, the same as Back in the browser.
- **The page shows the resume as it prints.** The page does not show the text that you edit to
  make the resume. You edit that text outside the app.
- **No fit analysis from before.** When a new fit analysis replaces an old one, the page shows only
  the new one.
- **No older resume.** The page shows only the current tailored resume. You said on 14 Nov 2026
  that you do not need the older one.
