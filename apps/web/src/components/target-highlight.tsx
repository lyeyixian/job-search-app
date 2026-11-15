"use client";

import { useEffect } from "react";

const MOMENT = 2500;

/**
 * Makes the part of the page that the address names stand out for a moment. A link to one
 * achievement has the anchor of the achievement in its address.
 */
export function TargetHighlight() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let shown: HTMLElement | null = null;

    const show = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      // A page that the person left can stay in the document, hidden, with the same id.
      const target = id
        ? [...document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)].find((element) =>
            element.checkVisibility(),
          )
        : null;
      if (!target) return;
      shown?.removeAttribute("data-highlight");
      shown = target;
      target.setAttribute("data-highlight", "");
      clearTimeout(timer);
      timer = setTimeout(() => target.removeAttribute("data-highlight"), MOMENT);
    };

    show();
    window.addEventListener("hashchange", show);
    return () => {
      window.removeEventListener("hashchange", show);
      clearTimeout(timer);
      shown?.removeAttribute("data-highlight");
    };
  }, []);

  return null;
}
