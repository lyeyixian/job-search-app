"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Web decides what to show from the code of the error, not from its text.
function failureText(code: string): string {
  switch (code) {
    case "vault_pull_failed":
      return "The app could not get the newest vault.";
    case "api_unreachable":
      return "The API cannot be reached.";
    default:
      return "Refresh failed.";
  }
}

/** The time in the time zone of the device. The server does not know that time zone, so the text comes after the page loads. */
function LocalTime({ time }: { time: string }) {
  const [text, setText] = useState("");
  useEffect(() => setText(timeFormat.format(new Date(time))), [time]);
  return (
    <time dateTime={time} className="tabular-nums" data-testid="vault-time">
      {text}
    </time>
  );
}

/** Sends a Refresh to the API through Web. Returns the code of the failure, or null. */
async function sendRefresh(): Promise<string | null> {
  try {
    const response = await fetch("/api/refresh", { method: "POST" });
    if (response.ok) return null;
    const problem: { code?: unknown } = await response.json();
    return typeof problem.code === "string" ? problem.code : "api_unreachable";
  } catch {
    return "api_unreachable";
  }
}

/**
 * Shows the time of the last update from the vault and the Refresh button. After a Refresh the
 * page gets its data again. If a Refresh fails, a banner shows the error and the old time.
 */
export function RefreshControl({ loadedAt }: { loadedAt: string | null }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [drawing, startDrawing] = useTransition();
  const [failure, setFailure] = useState<string | null>(null);
  const busy = sending || drawing;

  async function refresh() {
    setSending(true);
    setFailure(null);
    const code = await sendRefresh();
    setSending(false);
    if (code) {
      setFailure(code);
    } else {
      startDrawing(() => router.refresh());
    }
  }

  return (
    <>
      <div
        className="flex min-h-11 items-center gap-2 px-2 text-muted-foreground text-xs sm:px-3"
        data-testid="vault-status"
      >
        <p>
          {loadedAt ? (
            <>
              Vault updated <LocalTime time={loadedAt} />
            </>
          ) : (
            "No vault data yet"
          )}
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="flex h-8 items-center rounded-md border px-2.5 font-medium text-foreground text-xs hover:bg-muted disabled:opacity-60"
        >
          {busy ? "Refreshing" : "Refresh"}
        </button>
      </div>
      {failure ? (
        <p
          role="alert"
          className="basis-full border-amber-300 border-t bg-amber-100 px-3 py-2 text-amber-900 text-sm"
          data-testid="refresh-failed"
        >
          {failureText(failure)}{" "}
          {loadedAt ? (
            <>
              The data is from <LocalTime time={loadedAt} />.
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
