---
type: role
company: Harbour Bank
title: Graduate Software Engineer
team: Payments
programme: harbour-graduate-programme
start: 2021-08
end: 2022-06
skills: [java, postgres]
---
## Context

The first stint of the programme. The Payments team runs the transfer service.

## Achievements

### Retry for failed transfers

- **Situation:** A failed transfer needed a person to send it again.
- **Action:** Added a retry queue with a limit of three attempts.
- **Result:** Manual resends fell from 40 to 3 each week.

## Reflections

A retry without a limit is an outage that waits for its day.
