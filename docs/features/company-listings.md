# Company listings

The company listings page shows all that the market scan knows about one company: each listing
that a sweep found, and what the watchlist says about the company. The listing page shows one
listing in full. You use them when you want to look past the shortlist.

**As** the person who runs this job search,
**I want** to see all the listings of one company and read each one,
**so that** I can check a triage and find a listing that the shortlist does not show.

## Acceptance criteria

### 1. Find a company

- **Given** the market scan has more than one company
- **When** I open the list of companies
- **Then** I see each company with its mode, the day of its last sweep and the number of its open
  listings that have the triage `shortlist`
- **And** a company that is on the watchlist and has no sweep is not in the list

### 2. See the listings of one company

- **Given** I open the listings page of a company
- **When** I look at the page
- **Then** I see one row for each listing with the triage `shortlist` or `maybe`
- **And** each row shows the title, the level, the triage, the reason, the day first seen, the day
  last seen and the state

### 3. Rejected listings are hidden first

- **Given** a company has listings with the triage `reject`
- **When** I open its listings page
- **Then** those listings are hidden
- **And** the page shows the number of hidden listings
- **When** I choose to show them
- **Then** I see them in the same list

### 4. Closed listings look different

- **Given** a listing has the state `closed` or `unknown`
- **When** I look at its row
- **Then** its row is grey, its title has a line through it, and a badge shows its state

### 5. See which listings I promoted

- **Given** I promoted a listing to an application
- **When** I look at its row
- **Then** the row links to the application page

### 6. Read what the watchlist says about the company

- **Given** the company is on the watchlist
- **When** I look at its listings page
- **Then** I see its mode, the day of its last sweep and a link to its job board
- **And** I see the notes about the company, its pay and its remote work

### 7. See when the company was swept

- **Given** the company was swept more than one time
- **When** I look at its listings page
- **Then** I see the day of each sweep, newest first

### 8. Read one listing

- **Given** I select a listing
- **When** its page opens
- **Then** I see the company, the title, the region, the level and the day first seen
- **And** I see the triage, the reason and the state
- **And** I see the full text of the listing as the job board had it

### 9. Open the listing on the job board

- **Given** I am on the page of a listing
- **When** I select the link to the job board
- **Then** the job board opens in a new tab

### 10. Go from a listing to its application

- **Given** I promoted the listing to an application
- **When** I look at the page of the listing
- **Then** I see a link to the application page

### 11. The listings to act on come first

- **Given** a company has listings with different triages and states
- **When** I look at its listings page
- **Then** the listings with the triage `shortlist` come first, then `maybe`, then `reject`
- **And** with the same triage, the open listings come before the others
- **And** then the listing first seen most recently comes first

## Assumptions

- The market scan has about 860 listings from 43 companies today. Most have the triage `reject`.
- A listing does not change after a sweep writes it. Only its triage, its state and its last-seen
  day change.
- The sweep log of a company has one line for each sweep, and the line starts with the day.

## Decisions

- **Rejected listings are hidden until you ask.** They are most of the market scan, and you look at
  them only to check a triage.
- **The watchlist's instructions for a sweep stay out.** The page shows what helps you judge a
  company. It does not show how a sweep reads the job board.
- **The sweeps show as days only.** The sweep log also holds the instructions for a sweep, and
  those stay out.
- **The page does not change a triage or a mode.** You change those outside the app.
