"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Companies are part of the market scan, which the menu calls Search.
const ITEMS = [
  { name: "Applications", href: "/applications", paths: ["/applications"] },
  { name: "Shortlist", href: "/shortlist", paths: ["/shortlist"] },
  { name: "Experience", href: "/experience", paths: ["/experience"] },
  { name: "Search", href: "/search", paths: ["/search", "/companies"] },
];

/** The menu at the top of each page. The feature is docs/features/every-page.md. */
export function SiteMenu() {
  const pathname = usePathname();
  return (
    <header className="border-b">
      <nav aria-label="Menu" className="mx-auto flex w-full max-w-7xl gap-1 px-2 sm:px-4" data-testid="site-menu">
        {ITEMS.map(({ name, href, paths }) => {
          const current = paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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
    </header>
  );
}
