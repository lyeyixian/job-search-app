import { connection } from "next/server";
import { Suspense } from "react";
import { getHealth } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// The skeleton page. It shows that Web reaches the API. The first feature replaces it:
// `/` then goes to `/applications`, as docs/architecture/routes.md says.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-4 sm:p-8">
      <h1 className="font-semibold text-2xl tracking-tight">Job search</h1>
      <Card>
        <CardHeader>
          <CardTitle>API status</CardTitle>
          <CardDescription>Web asks the API for its health on each page load.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-muted-foreground text-sm">Asking the API.</p>}>
            <ApiStatus />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function ApiStatus() {
  // The status is read on each request. Next.js does not prerender it.
  await connection();
  const health = await getHealth();

  if (health.ok) {
    return (
      <div className="flex items-center gap-3" data-testid="api-status">
        <Badge>API ok</Badge>
        <p className="text-sm">
          The vault index holds <span data-testid="note-count">{health.data.vault.notes}</span> notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="api-status">
      <Badge variant="destructive">API problem</Badge>
      <p className="text-sm">{problemText(health.code)}</p>
      {health.traceId ? <p className="font-mono text-muted-foreground text-xs">Trace {health.traceId}</p> : null}
    </div>
  );
}

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
