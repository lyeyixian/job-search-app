import { Badge } from "@/components/ui/badge";

// Web decides what to show from the code of the error, not from its text.
function problemText(code: string): string {
  switch (code) {
    case "index_not_ready":
      return "The app is starting.";
    case "api_unreachable":
      return "The API cannot be reached.";
    default:
      return "The API returned an error.";
  }
}

/** What a page shows in place of its data when a call to the API fails. */
export function ApiProblem({ code, traceId }: { code: string; traceId?: string | undefined }) {
  return (
    <div className="flex flex-col gap-2" data-testid="api-problem">
      <Badge variant="destructive">API problem</Badge>
      <p className="text-sm">{problemText(code)}</p>
      {traceId ? <p className="font-mono text-muted-foreground text-xs">Trace {traceId}</p> : null}
    </div>
  );
}
