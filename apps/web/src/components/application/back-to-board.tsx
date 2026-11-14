"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BOARD_SEARCH_KEY } from "@/components/board/board-search";

/** A link to the board with the filters that the person set last. */
export function BackToBoard() {
  const [search, setSearch] = useState("");
  useEffect(() => {
    try {
      setSearch(sessionStorage.getItem(BOARD_SEARCH_KEY) ?? "");
    } catch {
      // A browser can refuse storage. The link then goes to the board with no filters.
    }
  }, []);

  return (
    <Link href={`/applications${search}`} className="text-muted-foreground text-sm hover:underline">
      Back to the board
    </Link>
  );
}
