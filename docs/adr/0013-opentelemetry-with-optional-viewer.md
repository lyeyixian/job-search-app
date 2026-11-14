# ADR-0013: OpenTelemetry tracing, with an optional viewer

**Status:** Accepted (2026-11-14)

## Context

[ADR-0012](0012-problem-details-and-json-logs.md) tied the two services together with a request
id that Web invented and sent in an `X-Request-Id` header. OpenTelemetry does that with a standard
header and adds timing for each step. Traces need a place to be stored and shown, which is one
more container. The scan step will later run Claude Code for minutes at a time.

Options: instrument with the viewer optional, instrument with the viewer always on, or no
OpenTelemetry.

## Decision

Both services use the OpenTelemetry SDK. Web starts a trace for each page load, and the
`traceparent` header carries it to the API. Each log line holds the trace id. A service exports
traces only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. A Docker Compose profile adds a trace
viewer container, which runs only when asked for.

## Consequences

- The trace id replaces the request id of ADR-0012, and `traceparent` replaces `X-Request-Id`.
- With no endpoint set, nothing extra runs and no trace leaves the process.
- Traces stay on the home server, like the logs.
- A span never holds note content. The rule for logs applies to span attributes.
- Tracing is in place before the scan step needs it.
- The viewer is not chosen yet. Jaeger and Grafana's all-in-one image are the candidates.
