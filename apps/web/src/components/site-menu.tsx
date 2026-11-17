"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

// Companies are part of the market scan, which the menu calls Search.
const ITEMS = [
  { name: "Applications", href: "/applications", paths: ["/applications"] },
  { name: "Shortlist", href: "/shortlist", paths: ["/shortlist"] },
  { name: "Experience", href: "/experience", paths: ["/experience"] },
  { name: "Search", href: "/search", paths: ["/search", "/companies"] },
];

/** The links of the menu. With no `pathname`, no link has the mark of the current part. */
function MenuLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Menu" className="flex gap-1" data-testid="site-menu">
      {ITEMS.map(({ name, href, paths }) => {
        const current = paths.some((path) => pathname === path || pathname?.startsWith(`${path}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "-mb-px flex h-11 items-center border-b-2 px-2 text-sm sm:px-3",
              current
                ? "border-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {name}
          </Link>
        );
      })}
    </nav>
  );
}

function CurrentMenu() {
  return <MenuLinks pathname={usePathname()} />;
}

/**
 * The links of the menu at the top of each page. The feature is docs/features/every-page.md. The address is
 * known only at the time of a request, so the mark of the current part comes in after the links.
 */
export function SiteMenu() {
  return (
    <Suspense fallback={<MenuLinks pathname={null} />}>
      <CurrentMenu />
    </Suspense>
  );
}
