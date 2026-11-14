---
type: role
company: Northwind Traders
title: Software Engineer
team: Developer Tools
start: 2023-07
end: null
skills: [typescript, postgres, docker]
---

# Software Engineer, Northwind Traders

## Context

The Developer Tools team owns the build pipeline and the internal service catalogue.

## Achievements

### Cut build time

- **Situation:** The main build took 24 minutes.
- **Action:** Cached the dependency install and split the tests into four parallel jobs.
- **Result:** The build takes 9 minutes.

### Service catalogue

- **Situation:** Nobody knew which team owned which service.
- **Action:** Built a catalogue that reads the owner from each repository.
- **Result:** 140 services have a named owner.
