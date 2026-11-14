# ADR-0007: Serve the committed resume PDF

**Status:** Accepted (2026-11-14)

## Context

The spec asks for the resume as it prints, with a download. The vault commits a `resume.pdf` next to each tailored resume.

## Decision

The app serves the committed PDF and never renders a resume. The page draws it with PDF.js. The download returns the original file.

## Consequences

- The app does not need the vault's Python and Typst render tools.
- PDF.js is needed because the built-in viewer on an iPhone does not show a PDF inside a page.
- A resume changed in the vault but not rendered again shows the old PDF.
