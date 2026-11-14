# ADR-0012: Problem Details for errors, JSON lines for logs

**Status:** Accepted (2026-11-14)

## Context

The API needs one error shape for all endpoints. The spec says a note with a mistake must still
show, with a warning. The app is two services, so a failure has to be followed across both. The
notes are personal data.

Options: RFC 9457 Problem Details with structured JSON logs, or a bare error message with text
logs.

## Decision

- An API error is a Problem Details response (RFC 9457) with a `code` field added.
- A note that breaks the schema is not an error. The API returns it with a `warnings` list.
- Both services write JSON lines to standard output, one line per request, with a request id that
  Web passes to the API.
- Logs never hold note content.
- No error tracking service.

## Consequences

- OpenAPI tools know the error shape, and one schema covers every endpoint.
- Web switches on `code`, never on the text of a message.
- One page load can be followed across both services by its request id.
- The logs stay on the server. `docker compose logs` reads them.
