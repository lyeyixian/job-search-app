"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Draws each page of a PDF with PDF.js, as wide as the part of the page that holds it. The viewer
 * of an iPhone does not show a PDF inside a page. See docs/adr/0007.
 */
export function ResumeView({ url, fileName }: { url: string; fileName: string }) {
  const pages = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const holder = pages.current;
    if (!holder) return;
    let stopped = false;
    let close = () => {};

    async function draw(target: HTMLDivElement) {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const task = pdfjs.getDocument({ url });
      close = () => void task.destroy();
      const pdf = await task.promise;
      const width = target.clientWidth;
      const canvases: HTMLCanvasElement[] = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        const page = await pdf.getPage(number);
        // Draw at the pixels of the screen, so the text is sharp.
        const scale = (width / page.getViewport({ scale: 1 }).width) * (window.devicePixelRatio || 1);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = "w-full rounded-md border bg-white shadow-xs";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `Resume, page ${number} of ${pdf.numPages}`);
        canvas.dataset.testid = "resume-page";
        await page.render({ canvas, viewport }).promise;
        canvases.push(canvas);
      }
      if (stopped) return;
      target.replaceChildren(...canvases);
      setState("ready");
    }

    draw(holder).catch(() => {
      if (!stopped) setState("failed");
    });
    return () => {
      stopped = true;
      close();
    };
  }, [url]);

  return (
    <div className="flex flex-col gap-3" data-testid="resume" data-state={state}>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={url}
          download={fileName}
          className="flex h-10 items-center rounded-md border px-3 font-medium text-sm hover:bg-secondary"
        >
          Download the resume
        </a>
        {state === "loading" ? <p className="text-muted-foreground text-sm">Getting the resume.</p> : null}
        {state === "failed" ? (
          <p className="text-destructive text-sm">The app cannot draw the resume. Download it to read it.</p>
        ) : null}
      </div>
      <div ref={pages} className="mx-auto flex w-full max-w-3xl flex-col gap-4" />
    </div>
  );
}
