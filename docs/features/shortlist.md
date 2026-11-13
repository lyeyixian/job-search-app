# Shortlist

The shortlist shows each open listing that has the triage `shortlist`, for all the companies on
the watchlist. A company gives you a limited number of application slots, so you compare listings
between companies before you promote one.

**As** the person who runs this job search,
**I want** to see the shortlisted listings of all companies in one place,
**so that** I can choose which listings to promote to applications.

## Acceptance criteria

### 1. See the shortlisted listings

- **Given** the market scan has open listings with the triage `shortlist`
- **When** I open the shortlist
- **Then** I see one row for each of those listings
- **And** each row shows the company, the title, the level, the reason and the day first seen
- **And** I see the total number of rows

### 2. Only open, shortlisted listings

- **Given** a listing is closed, or its triage is `maybe` or `reject`
- **When** I open the shortlist
- **Then** the listing is not on it

### 3. See which listings I promoted

- **Given** I promoted a listing to an application
- **When** I look at its row
- **Then** the row shows the status of the application
- **And** I can go to the application page with one selection

### 4. Show only the listings that I did not promote

- **Given** some listings have an application and some do not
- **When** I choose to hide promoted listings
- **Then** I see only the listings with no application

### 5. Narrow the shortlist to one company

- **Given** the shortlist has listings from more than one company
- **When** I choose a company
- **Then** I see only the listings of that company
- **And** I see the number of them

### 6. Newest listings first

- **Given** the shortlist has more than one listing
- **When** I open the shortlist
- **Then** the listings of one company are together
- **And** in each company the listing first seen most recently comes first

### 7. Open a listing

- **Given** I am on the shortlist
- **When** I select a listing
- **Then** I see the page of that listing

### 8. Go to the company

- **Given** I am on the shortlist
- **When** I select the name of a company
- **Then** I see the listings page of that company

### 9. No shortlisted listings

- **Given** no open listing has the triage `shortlist`
- **When** I open the shortlist
- **Then** the page tells me that the shortlist is empty

## Assumptions

- The shortlist has about 45 listings today. One page holds them all.
- The reason of a listing is one line of text.

## Decisions

- **Grouped by company.** Application slots are counted for each company, so you compare the
  listings of one company first.
- **The shortlist does not start a sweep.** A later version adds that.
- **The shortlist does not promote a listing.** You promote a listing outside the app for now.
