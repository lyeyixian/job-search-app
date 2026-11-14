import { context, propagation, trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, TracerProvider } from "@opentelemetry/sdk-trace";
import { config } from "./config.js";

// Registers the tracer, the context manager and the W3C traceparent propagator.
// Spans leave the process only if OTEL_EXPORTER_OTLP_ENDPOINT is set.
export function startTelemetry(): TracerProvider {
  const provider = new TracerProvider({
    resource: resourceFromAttributes({ "service.name": "job-search-api" }),
    spanProcessors: config.otlpEndpoint ? [new BatchSpanProcessor({ exporter: new OTLPTraceExporter() })] : [],
  });
  context.setGlobalContextManager(new AsyncLocalStorageContextManager());
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  trace.setGlobalTracerProvider(provider);
  return provider;
}
