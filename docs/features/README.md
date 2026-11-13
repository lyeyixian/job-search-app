# Features

The features of the web app, one file for each feature. The web app shows the vault in a browser.
In this version you can read the vault. You cannot change it.

The vault's glossary defines the terms that these files use, such as application, verdict, listing
and triage.

## The features

| Feature | What you do with it |
|---|---|
| [Application board](application-board.md) | See all the applications, grouped by status. |
| [Application page](application-page.md) | Read one application: the posting, the fit analysis and the tailored resume. |
| [Shortlist](shortlist.md) | See the open listings that are worth an application, for all companies. |
| [Company listings](company-listings.md) | See all the listings of one company, and read one listing. |
| [Experience](experience.md) | Read the profile, the role notes, the project notes, the stories and the skills inventory. |
| [Direction and targets](direction-and-targets.md) | Read the direction and the targets. |
| [Links between notes](links-between-notes.md) | Go from one note to a note that it names. |

## How each file is written

Each file has these parts:

1. A short description of the feature.
2. A user story.
3. The acceptance criteria. Each one has a number, a name and the steps Given, When and Then.
4. The assumptions.
5. The decisions, with the reason for each one.

## Acceptance criteria for all features

These apply to each feature. The feature files do not repeat them.

### 1. Go to each feature from all pages

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
- **Given** a device is not one of mine
- **When** a person tries to open the app on it
- **Then** the app does not open

### 4. Use each page on a phone

- **Given** I open a page on my phone
- **When** I read the page
- **Then** I can read all the text without zooming
- **And** the page does not scroll sideways, apart from the board and wide tables

### 5. Know how fresh the data is

- **Given** I am on a page of the app
- **When** I look at the page
- **Then** I see the time of the last update from the vault
- **When** I select **Refresh**
- **Then** the app gets the newest saved vault, and the page shows the new time

### 6. A note with a mistake does not stop the app

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
