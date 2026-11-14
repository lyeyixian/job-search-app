# ADR-0006: Tailwind CSS with shadcn/ui

**Status:** Accepted (2026-11-14)

## Context

The app has a board, tables, filters, tabs and long pages of rendered markdown, and each page must work on a phone.

Options: Tailwind with shadcn/ui, a full library such as Mantine or MUI.

## Decision

Tailwind CSS for styling, shadcn/ui for components.

## Consequences

- The components are plain files in this repo and can be changed.
- Radix handles keyboard use and focus.
- Phone layouts use Tailwind breakpoint classes.
- Fewer ready-made parts than a full library. A sortable table is ours to build.
