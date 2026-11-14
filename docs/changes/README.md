# Changes

A change is a proposal to add, change or remove behaviour of the app. This folder holds each
change that is not on `main` yet, and an archive of the changes that are.

[`../features/`](../features/README.md) is the baseline. It says what the app on `main` does, and
nothing more. A behaviour that is not built yet is in a change, not in the baseline.

```text
docs/changes/
├── README.md                         # this page
├── change-status-from-board/         # one change that is open
│   ├── README.md                     # the reason, the status and the files it changes
│   └── application-board.md          # the changes to one feature file
└── archive/
    └── 2026-11-20-open-the-resume/   # one change that is on main
```

## Who approves what

| Folder | Who changes it | The gate |
|---|---|---|
| `docs/features/` | An agent, only to fold a change that the owner approved | The label `owner-approved` |
| `docs/adr/` | An agent adds a file with the status `Proposed`. Only the owner makes it `Accepted`. | The label `owner-approved` |
| `docs/changes/` | An agent, to propose a change | The owner approves the change in words before code is written |
| All other docs | An agent, to keep them the same as the code | None |

The owner is the person who owns the repo. An agent never adds the label `owner-approved`.

## The steps of a change

1. **Propose.** Write the change folder. Open a draft pull request that holds only the change
   folder and the proposed ADRs. Ask the owner to read it. Do not write code.
2. **Approve.** The owner approves the change in words, in the conversation or on the pull
   request. Then set the status of the change to `Approved`, with the date. If the owner asks for
   a different behaviour, correct the change first.
3. **Build.** Write the code and the tests in the same pull request. Name each browser test after
   its criterion in the change.
4. **Fold.** In the last commit, apply the change to the feature files in `docs/features/`. Move
   the change folder to `archive/`, with the date in front of its name.
5. **Merge.** The owner compares the fold with the change, adds the label `owner-approved` and
   merges. The baseline and the code change on `main` in the same commit.

A push that changes `docs/adr/` or `docs/features/` removes the label. The owner then adds the
label again.

## Questions that come up in the build

- If the app must do a thing that the person sees and no approved criterion covers it, stop and
  ask the owner. Add the answer to the change as a criterion. Do not record it as a decision or an
  assumption of your own.
- If the build needs a choice that an ADR records, stop and ask the owner. Write the ADR with the
  status `Proposed`. Make it `Accepted` only after the owner accepts that ADR in words.
- A detail of the code that the person does not see, and that is easy to reverse, needs no
  approval. Record it on the page in `docs/architecture/` for that part.

## What needs no change

- A fix that makes the code do what a criterion in the baseline already says.
- A change to the code that the person cannot see.

## The change folder

Name the folder after the change, in lower case with hyphens.

### `README.md`

```markdown
# Change: the change in a few words

**Status:** Proposed (2026-11-14)

Two to four sentences. Say what the person can do after the change and why they want it.

## Files

- [application-board.md](application-board.md) changes the application board.
- [status-history.md](status-history.md) is a new feature.
- [ADR-0019](../../adr/0019-the-decision.md) is proposed with this change.
```

The status is `Proposed` or `Approved`.

### A file for a feature that is in the baseline

Give the file the name of the feature file that it changes. Write only the parts that change.
Remove a heading that has nothing below it.

```markdown
# Application board

Baseline: [application-board.md](../../features/application-board.md)

## Added criteria

### 10. The result, in a few words

- **Given** ...
- **When** ...
- **Then** ...

## Changed criteria

### 2. The title of the criterion after the change

The full text of the criterion after the change.

## Removed criteria

### 5. The title of the criterion

One sentence that says why the app stops doing this.

## Other changes

- A change to the description, the user story, an assumption or a decision.
```

- An added criterion takes the next free number of the feature file.
- A criterion keeps its number. Do not give the number of a removed criterion to a new one. The
  name of a browser test holds the number.
- If a second open change adds a criterion to the same feature, the change that folds second
  takes the next free number at the fold.

### A file for a new feature

Write the full feature file, in the form of the files in `docs/features/`. The fold moves the
file to `docs/features/` and adds it to the README there.
