# Errors, logging and tracing

How a failure looks to the API, to the person, in the logs and in a trace. See
[ADR-0012](../adr/0012-problem-details-and-json-logs.md) and
[ADR-0013](../adr/0013-opentelemetry-with-optional-viewer.md).

## What counts as an error

| Case | API response | What the person sees |
|---|---|---|
| A note has a missing field or a bad value | `200`, the note with a `warnings` list | The note, with a warning that names the field |
| A link names a note or an achievement that does not exist | `200`, the link marked as missing | Text with a mark, not a link |
| No note has that slug | `404` problem, code `note_not_found` | A not-found page |
| No route matches the path | `404` problem, code `route_not_found` | A not-found page |
| An application has no resume | `404` problem, code `resume_not_found` | "No resume exists yet" |
| Refresh cannot pull the vault | `502` problem, code `vault_pull_failed` | A banner with the error and the old time |
| The API has no index yet | `503` problem, code `index_not_ready` | "The app is starting" |
| The API does not answer | none | "The API cannot be reached" |
| A bug in the API | `500` problem, code `internal_error` | An error page with the trace id |

## The error shape

Every error response has the media type `application/problem+json`.

```json
{
  "type": "https://github.com/lyeyixian/job-search-app/blob/main/docs/architecture/errors-and-logging.md#note_not_found",
  "title": "Note not found",
  "status": 404,
  "detail": "No application has the slug example-company-backend-engineer.",
  "code": "note_not_found",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

- Web reads `code`. It never reads the text of `title` or `detail` to decide what to do.
- A new code gets a row in the table above in the same pull request.

## Sequence: a failed request

How does one failure show up in both services?

```mermaid
sequenceDiagram
    autonumber
    actor User as Job seeker
    participant Web
    participant API
    participant Log as Standard output

    User->>Web: opens a page
    Web->>Web: starts a trace
    Web->>API: GET with the traceparent header
    alt the API does not answer
        Web->>Log: an error line with the trace id
        Web-->>User: the API cannot be reached
    else the API returns a problem
        API->>Log: a line with the trace id, the status and the code
        API-->>Web: a problem response
        Web->>Log: a line with the trace id
        Web-->>User: the page for that code
    else the API returns data
        API->>Log: a line with the trace id and the status
        API-->>Web: 200 with JSON
        Web-->>User: the page
    end
```

## Logs

Each service writes one JSON line per request to standard output.

```json
{"level":"info","time":"2026-11-14T08:47:10Z","service":"api","traceId":"4bf92f3577b34da6a3ce929d0e0e4736","method":"GET","path":"/api/applications/example","status":404,"code":"note_not_found","ms":3}
```

- The API uses the `pino` library.
- Web writes one line for each call to the API. It does not write a line for a page load yet.
- Each line holds the id of the current trace.
- A log line never holds note content, frontmatter values or the text of a posting. A slug in a
  path is permitted.
- Refresh logs the commit, the count of notes and the count of warnings.
- Read the logs with `docker compose logs api` and `docker compose logs web`.

## Tracing

Both services use the OpenTelemetry SDK.

| Span | Service | Covers |
|---|---|---|
| Page render | Web | One page load, from the request to the HTML |
| API call | Web | One call from Web to the API |
| Route | API | One endpoint, from the request to the response |
| Query | API | One read of the vault index |
| Refresh | API | The pull, the parse and the swap, each as a child span |

- Web starts the trace. The `traceparent` header carries it to the API.
- A service exports traces only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. With no setting,
  nothing is exported.
- A span attribute never holds note content. The rule for logs applies.

### See the traces

The viewer is Grafana. The `tracing` profile is not set up yet. These steps are the plan.

1. Run `docker compose --profile tracing up -d`. This starts the trace viewer and sets the
   endpoint for both services.
2. Open the viewer on its port on the server.
3. Find a trace by the `traceId` from a log line or an error page.
4. Run `docker compose --profile tracing down` to stop the viewer.
