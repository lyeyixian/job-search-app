---
type: application
company: Quill Works
title: Full Stack Engineer
region: sg
status: analyzed
url: https://example.com/quill-works/jobs/42
source-listing: null
captured: 2026-10-28
verdict: good-fit
direction: caution
analyzed: 2026-10-28
---

# Full Stack Engineer

Quill Works is a made-up company. This posting is not real.

## Requirements

- Three years of backend work
- TypeScript or Python
- React in production

## Fit analysis

### Verdict: good-fit

Meets the backend requirements. The frontend requirement is partial.

### Direction check: caution

- **Caution:** half of the work is frontend, and the direction asks for backend and platform
  work.
- **Aligned:** the level is mid.

### Requirements

| Requirement | Kind | Firmness | Grade | Evidence |
|---|---|---|---|---|
| Three years of backend work | must-have | likely-flexible | met | `northwind-software-engineer#cut-build-time`: three years on the build pipeline. |
| TypeScript or Python | must-have | likely-firm | met | `northwind-software-engineer#service-catalogue`: TypeScript in production. |
| React in production | must-have | likely-firm | partial | `recipe-box#shopping-list`: React in a side project, not in production. |

### Gaps and bridging actions

Must-haves first.

| Requirement | Grade | Action | What to do |
|---|---|---|---|
| React in production | partial | `positioning` | Lead with the recipe box, and name the React parts of the service catalogue. |
