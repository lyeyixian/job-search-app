import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Search" };

const PARTS = [
  {
    name: "Direction",
    href: "/search/direction",
    text: "What I want: the target roles, the motivations and the constraints.",
  },
  { name: "Targets", href: "/search/targets", text: "The companies that I plan to apply to, in waves." },
  { name: "Companies", href: "/companies", text: "The market scan: each company with its listings." },
];

// Search is the vault's term for the plan and the market scan.
export default function SearchPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <h1 className="font-semibold text-2xl tracking-tight">Search</h1>
      <ul className="rounded-xl border" data-testid="search-parts">
        {PARTS.map(({ name, href, text }) => (
          <li key={href} className="flex flex-col gap-1 border-t px-3 py-3 first:border-t-0">
            <Link href={href} className="w-fit font-medium text-base underline underline-offset-2 sm:text-sm">
              {name}
            </Link>
            <p className="text-muted-foreground text-sm">{text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
