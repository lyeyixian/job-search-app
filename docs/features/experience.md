# Experience

The experience pages show your record of work: the profile, the role notes, the project notes,
the stories and the skills inventory. You use them to remind yourself what you did before an
interview, and to check what a fit analysis or a resume points to.

**As** the person who runs this job search,
**I want** to read my experience in one place, with each part linked to the others,
**so that** I can prepare for an interview and check the evidence behind a fit analysis.

## Acceptance criteria

### 1. Start from an overview

- **Given** I open Experience
- **When** I look at the page
- **Then** I see the profile, and the lists of role notes, project notes and stories
- **And** I see a link to the skills inventory

### 2. Read the profile

- **Given** I am on the Experience page
- **When** I look at the profile
- **Then** I see my contact details, education, certifications and languages

### 3. See the roles in time order

- **Given** I have more than one role note
- **When** I look at the list of roles
- **Then** the newest role comes first
- **And** each role shows the company, the title, the team and its start and end months
- **And** the current role shows "present" as its end

### 4. See the stints of one programme together

- **Given** some role notes are stints of the same programme
- **When** I look at the list of roles
- **Then** those stints are in one group under the programme

### 5. Read a role note

- **Given** I select a role
- **When** its page opens
- **Then** I see the context, the achievements and the reflections of the role
- **And** I see the skills of the role
- **And** I see the stories that come from the role

### 6. Go to one achievement

- **Given** a role note or a project note has more than one achievement
- **When** I open its page
- **Then** I see a list of the achievements, and I can go to each one with one selection
- **And** I can copy a link that opens the page at that achievement

### 7. See the projects

- **Given** I have more than one project note
- **When** I look at the list of projects
- **Then** each project shows its kind and its start and end months
- **And** I can tell which projects can go on a resume

### 8. Read a project note

- **Given** I select a project
- **When** its page opens
- **Then** I see its context, its achievements and its skills
- **And** I see a link to the project if the note has one

### 9. Find a story by competency

- **Given** I have stories with different competencies
- **When** I choose a competency
- **Then** I see only the stories with that competency
- **And** each story shows the roles that it comes from

### 10. Read a story

- **Given** I select a story
- **When** its page opens
- **Then** I see the story, its competencies and links to its roles

### 11. Read the skills inventory

- **Given** I open the skills inventory
- **When** I look at the page
- **Then** I see the skills by category
- **And** I see the pinned skills first

### 12. See where I used a skill

- **Given** a role note or a project note lists a skill
- **When** I select that skill, in the inventory or on a note
- **Then** I see each role and project that lists the skill, newest first

### 13. Notes that wait for an update stand out

- **Given** a note has text marked for a revisit
- **When** I read the note
- **Then** the mark is visible at that text

## Assumptions

- The vault has about 10 role notes, 10 project notes and 10 stories today. One page holds each list.
- Each role note and project note keeps its achievements under their own headings.
- You prepare for interviews from the stories and the achievements.

## Decisions

- **One feature for all of the experience.** The five kinds of note link to each other, so they are
  specified together.
- **The journal stays out.** You write journal entries in a different tool, and the curated notes
  hold what came out of them.
- **Projects that cannot go on a resume still show.** The app is for you, and you want the full
  record. The page marks them.
