# Application board

The board is the first thing you see when you open the app. It shows each application as a card,
grouped by status. You use it to see where the search stands and which application to work on
next.

**As** the person who runs this job search,
**I want** to see all my applications grouped by status,
**so that** I know which one to act on next.

## Acceptance criteria

### 1. See the applications by status

- **Given** I have applications with different statuses
- **When** I open the app
- **Then** I see one column for each of `analyzed`, `applied`, `interviewing` and `offer`
- **And** each application is a card in the column of its status
- **And** each column shows the number of its cards

### 2. Finished applications stay out of the way

- **Given** some applications are `accepted`, `rejected` or `dropped`
- **When** I open the board
- **Then** those applications are in a closed group at the end of the board
- **And** the group shows the number of applications for each of the three statuses
- **When** I open the group
- **Then** I see a card for each of those applications

### 3. Read a card

- **Given** an application is on the board
- **When** I look at its card
- **Then** I see the company, the title, the region, the verdict and the direction check
- **And** I see if the application has a tailored resume

### 4. The best fits come first

- **Given** a column has more than one card
- **When** I look at the column
- **Then** the cards are in the order `strong-fit`, `good-fit`, `stretch`, `skip`
- **And** cards with the same verdict show the newest application first

### 5. Narrow the board

- **Given** I am on the board
- **When** I choose a company, a region, a verdict or a direction check
- **Then** the board shows only the cards that match all my choices
- **And** each column shows the number of cards that match
- **When** I clear my choices
- **Then** all the cards come back

### 6. Open an application

- **Given** I am on the board
- **When** I select a card
- **Then** I see the page of that application

### 7. A status with no applications

- **Given** no application has the status `offer`
- **When** I open the board
- **Then** the `offer` column is still there, and it shows zero

### 8. Use the board on a phone

- **Given** I open the board on my phone
- **When** I look at a column
- **Then** I can read each card without zooming
- **And** I can swipe sideways to go to the next column

## Assumptions

- All the applications, about 40, have the status `analyzed` today. The first column is long until you start
  to apply.
- You change a status outside the app for now. The board shows the change the next time the app
  updates.

## Decisions

- **A board, not a table.** You chose the board on 13 Nov 2026. I proposed a table because one
  column holds all the cards today.
- **Finished applications start closed.** An application that is `accepted`, `rejected` or
  `dropped` needs no more action from you.
- **The board changes nothing in this version.** A later version lets you move a card to change
  its status.
