# Direction and targets

These two pages show the plan of the search. The direction records what you want: the target
roles, your motivations and your constraints. The targets list the companies that you plan to
apply to, in waves. You read them to check that an application still fits the plan.

**As** the person who runs this job search,
**I want** to read my direction and my targets in the app,
**so that** I can check a verdict or a triage against what I said I want.

## Acceptance criteria

### 1. Read the direction

- **Given** I open Search
- **When** I select the direction
- **Then** I see the full text of the direction
- **And** I see the target roles at the top
- **And** I see the day of its last update

### 2. Read the targets

- **Given** I open Search
- **When** I select the targets
- **Then** I see the full text of the targets, with the companies in their groups and waves
- **And** I see the day of its last update

### 3. Move in a long page

- **Given** the direction or the targets has more than one section
- **When** I open the page
- **Then** I see a list of its sections, and I can go to each one with one selection

### 4. Go from a target to its listings

- **Given** a target is a company that the market scan has
- **When** I select the company on the targets page
- **Then** I see the listings page of that company
- **Given** a target is a company that the market scan does not have
- **When** I look at the company on the targets page
- **Then** the company shows as plain text

### 5. Know when the direction is old

- **Given** the last update of the direction is more than three months ago
- **When** I open the direction
- **Then** the page tells me that the direction is due for a review

## Assumptions

- You write the direction and the targets by hand, as free text with headings and lists.
- The names of companies on the targets page match the names in the market scan closely enough to
  link them.

## Decisions

- **The pages show the text as you wrote it.** The app does not turn the targets into a table or a
  board, because the text has no fixed form.
- **Three months for the review reminder.** Your routine updates the direction each quarter.
- **The menu calls this part Search.** It is the vault's term for the plan and the market scan.
