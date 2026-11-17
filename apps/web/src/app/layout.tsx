import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteMenu } from "@/components/site-menu";
import { VaultStatus } from "@/components/vault-status";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Job search", template: "%s · Job search" },
  description: "Shows a private markdown vault in a browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between px-2 sm:px-4">
            <SiteMenu />
            {/* The time is read on each request, so it comes in after the menu. */}
            <Suspense fallback={null}>
              <VaultStatus />
            </Suspense>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
