import type { CompanyListing } from "@/api/client";
import { LISTING_STATE_LABEL, TRIAGE_LABEL, TRIAGE_STYLE } from "@/components/board/labels";
import { Badge } from "@/components/ui/badge";

/** The triage of a listing as a badge. */
export function TriageBadge({ triage }: { triage: CompanyListing["triage"] }) {
  if (!triage) return <span className="text-amber-900 text-sm">No triage</span>;
  return (
    <Badge variant="outline" className={TRIAGE_STYLE[triage]}>
      {TRIAGE_LABEL[triage]}
    </Badge>
  );
}

/** The state of a listing. An open listing is plain text. A listing that is not open gets a badge with a line. */
export function StateLabel({ state }: { state: CompanyListing["state"] }) {
  if (!state) return <span className="text-amber-900 text-sm">No state</span>;
  if (state === "open") return <span className="text-sm">{LISTING_STATE_LABEL.open}</span>;
  return (
    <Badge variant="outline" className="border-foreground/40 border-dashed text-foreground">
      {LISTING_STATE_LABEL[state]}
    </Badge>
  );
}
