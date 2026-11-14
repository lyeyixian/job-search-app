import Link from "next/link";
import type { ApplicationSummary } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIRECTION_LABEL, REGION_LABEL, VERDICT_LABEL } from "./labels";

const VERDICT_STYLE = {
  "strong-fit": "border-transparent bg-emerald-700 text-white",
  "good-fit": "border-transparent bg-emerald-100 text-emerald-900",
  stretch: "border-transparent bg-amber-100 text-amber-900",
  skip: "border-transparent bg-secondary text-muted-foreground",
} as const;

const DIRECTION_STYLE = {
  aligned: "text-foreground",
  caution: "border-amber-500 text-amber-900",
  conflict: "border-destructive text-destructive",
} as const;

function warningText(warning: ApplicationSummary["warnings"][number]): string {
  return warning.problem === "missing"
    ? `The note has no ${warning.field}.`
    : `The note has a ${warning.field} that the vault's rules do not permit.`;
}

/** One application on the board. The whole card is a link to the page of the application. */
export function ApplicationCard({ application }: { application: ApplicationSummary }) {
  const { slug, company, title, region, verdict, direction, hasResume, warnings } = application;
  return (
    <li>
      <Link
        href={`/applications/${slug}`}
        data-testid="application-card"
        data-slug={slug}
        className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-xs outline-none hover:border-ring focus-visible:ring-2"
      >
        <div>
          <p className="font-semibold text-base leading-snug" data-testid="card-company">
            {company ?? "No company"}
          </p>
          <p className="text-muted-foreground text-sm" data-testid="card-title">
            {title ?? "No title"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" data-testid="card-region">
            {region ? REGION_LABEL[region] : "No region"}
          </Badge>
          <Badge variant="outline" className={cn(verdict && VERDICT_STYLE[verdict])} data-testid="card-verdict">
            {verdict ? VERDICT_LABEL[verdict] : "No verdict"}
          </Badge>
          <Badge variant="outline" className={cn(direction && DIRECTION_STYLE[direction])} data-testid="card-direction">
            Direction: {direction ? DIRECTION_LABEL[direction].toLowerCase() : "none"}
          </Badge>
          <Badge
            variant={hasResume ? "secondary" : "outline"}
            className={cn(!hasResume && "text-muted-foreground")}
            data-testid="card-resume"
          >
            {hasResume ? "Resume" : "No resume"}
          </Badge>
        </div>
        {warnings.length > 0 ? (
          <ul className="flex flex-col gap-0.5 text-amber-900 text-xs" data-testid="card-warnings">
            {warnings.map((warning) => (
              <li key={warning.field}>Warning: {warningText(warning)}</li>
            ))}
          </ul>
        ) : null}
      </Link>
    </li>
  );
}
