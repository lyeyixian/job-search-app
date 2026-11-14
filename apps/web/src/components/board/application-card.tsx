import Link from "next/link";
import type { ApplicationSummary } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DIRECTION_LABEL, DIRECTION_STYLE, REGION_LABEL, VERDICT_LABEL, VERDICT_STYLE, warningText } from "./labels";

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
