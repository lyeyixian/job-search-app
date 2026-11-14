import { trace } from "@opentelemetry/api";

type Fields = Record<string, string | number | undefined>;

/** Writes one JSON line to standard output, with the id of the current trace. */
export function log(level: "info" | "error", fields: Fields) {
  const line = {
    level,
    time: new Date().toISOString(),
    service: "web",
    traceId: trace.getActiveSpan()?.spanContext().traceId,
    ...fields,
  };
  console[level === "error" ? "error" : "log"](JSON.stringify(line));
}
