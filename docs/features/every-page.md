# Every page

Some things are true on each page of the app, whichever feature you use. You get to each feature
from a menu, you need no sign-in, each page works on a phone, and the app only reads the vault.
The other feature files do not repeat these criteria.

**As** the person who runs this job search,
**I want** each page of the app to work in the same way,
**so that** I can use the app on all my devices without a thought about how it works.

## Acceptance criteria

### 1. Go to each feature from each page

- **Given** I am on a page of the app
- **When** I look at the top of the page
- **Then** I see a menu with Applications, Shortlist, Experience and Search
- **And** I can go to each of them with one selection

### 2. The app changes nothing

- **Given** I use a feature of the app
- **When** I select, filter or open something
- **Then** nothing in the vault changes

### 3. Open the app with no sign-in

- **Given** I am on one of my own devices
- **When** I open the app
- **Then** I see the application board, and the app does not ask me to sign in

### 4. Other devices cannot open the app

- **Given** a device is not one of mine
- **When** a person tries to open the app on that device
- **Then** the app does not open

### 5. Use each page on a phone

- **Given** I open a page on my phone
- **When** I read the page
- **Then** I can read all the text without zooming
- **And** the page does not scroll sideways, apart from the board and wide tables

### 6. Know how fresh the data is

- **Given** I am on a page of the app
- **When** I look at the page
- **Then** I see the time of the last update from the vault
- **When** I select **Refresh**
- **Then** the app gets the newest saved vault, and the page shows the new time

### 7. A note with a mistake does not stop the app

- **Given** a note has a missing field or a value that the vault's rules do not permit
- **When** I open a page that shows the note
- **Then** the page shows the note with a warning that names the field
- **And** all the other notes show as usual

## Assumptions

- You are the only user of the app.
- You keep doing your writing where you do it today. You write journal entries and change notes
  outside the app.
- The app shows a change only after you save it to the shared copy of the vault. Work in
  progress on your laptop does not show.

## Decisions

- **No sign-in.** Only your own devices can reach the app, so a sign-in adds a step and no safety.
  You chose this on 13 Nov 2026.
- **Each page works on a phone.** You asked for this on 13 Nov 2026.
- **Not in this version:** the journal, the general resumes, a search across all notes, and all
  changes to notes or statuses.
- **Later versions.** You want to start a sweep from the app, find companies that are not on the
  watchlist, and change a status on the board. Each one gets its own feature file when it is
  designed.
