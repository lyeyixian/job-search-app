---
type: application
company: Example Co
title: Backend Engineer
region: sg
status: applied
url: https://example.com/careers/1001
source-listing: example-co/backend-engineer-1001
captured: 2026-10-05
verdict: good-fit
direction: aligned
analyzed: 2026-10-07
---

# Backend Engineer

Example Co is a made-up company. This posting is not real.

## About the team

The Developer Tools team builds the services that 300 engineers use each day: the build
pipeline, the deploy service and the service catalogue.

## What you will do

- Build and run backend services in TypeScript
- Cut the time from a commit to a deploy
- Share an on-call rota with five engineers

## Requirements

- Three years of backend work
- TypeScript or Python in production
- Experience with a relational database
- Has run a service on Kubernetes

## Nice to have

- Experience with a public API
- Has spoken at a meetup

## Fit analysis

### Verdict: `good-fit`

The must-haves are pitched at three years, and three of the four are `met`. The Kubernetes
must-have is `partial`, and the evidence for it is a side project, not production work. Both
nice-to-haves are weak, but the posting does not lean on them.

### Direction check: `aligned`

- **Aligned:** the team builds tools for other engineers, which is the platform work that
  `direction.md` asks for.
- **Aligned:** the level is mid, with no senior tag.

### Requirements

| Requirement | Kind | Firmness | Grade | Evidence |
|---|---|---|---|---|
| Three years of backend work | must-have | likely-flexible: a years number | met | `northwind-software-engineer#cut-build-time`: three years on the build pipeline. |
| TypeScript or Python in production | must-have | likely-firm: the stack of the team | met | `northwind-software-engineer#service-catalogue`: TypeScript in production. `recipe-box#shopping-list`: TypeScript in a side project. |
| Experience with a relational database | must-have | likely-flexible | met | `recipe-box#shopping-list`: Postgres holds the recipes. |
| Has run a service on Kubernetes | must-have | likely-firm: "has run", not "knows" | partial | `northwind-software-engineer#on-call-rota`: Docker in production, but no cluster. |
| Experience with a public API | nice-to-have | likely-flexible | gap | |
| Has spoken at a meetup | nice-to-have (the posting calls it a plus) | likely-flexible | gap | |

### Gaps and bridging actions

**Must-haves**

- **Has run a service on Kubernetes** (partial): `positioning`. Name Docker in the build
  pipeline bullet, and say that the pipeline deploys to a cluster that a second team runs.

**Nice-to-haves**

- **Experience with a public API** (gap): `learning`. Publish the API of the recipe box with
  an OpenAPI document and a rate limit.
- **Has spoken at a meetup** (gap): `learning`. Give the build time talk at a local meetup.
