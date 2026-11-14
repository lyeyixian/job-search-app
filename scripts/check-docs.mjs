// Checks the docs: each relative link points at a file and a heading that exist,
// and each Mermaid diagram parses.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const files = execFileSync("git", ["ls-files", "*.md"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter((file) => file && !file.startsWith("fixtures/") && !file.startsWith("apps/"));

const errors = [];
const diagrams = [];

/** The anchor that GitHub gives a heading. */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

function read(file) {
  const text = readFileSync(join(root, file), "utf8");
  const prose = [];
  const blocks = [];
  let fence = null;
  for (const line of text.split("\n")) {
    const mark = line.match(/^\s*(```+|~~~+)\s*(\w*)/);
    if (fence) {
      if (mark?.[1]?.startsWith(fence.mark) && !mark[2]) {
        if (fence.lang === "mermaid") blocks.push(fence.lines.join("\n"));
        fence = null;
      } else {
        fence.lines.push(line);
      }
    } else if (mark) {
      fence = { mark: mark[1], lang: mark[2], lines: [] };
    } else {
      prose.push(line);
    }
  }
  const headings = prose.filter((line) => /^#{1,6}\s/.test(line)).map((line) => slug(line.replace(/^#+\s/, "")));
  return { prose: prose.join("\n"), headings, blocks };
}

const parsed = new Map(files.map((file) => [file, read(file)]));

for (const [file, { prose, blocks }] of parsed) {
  blocks.forEach((code, index) => {
    diagrams.push({ file, index: index + 1, code });
  });

  const withoutInlineCode = prose.replace(/`[^`\n]*`/g, "");
  for (const match of withoutInlineCode.matchAll(/\]\(([^)\s]+)\)/g)) {
    const link = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(link)) continue;

    const [path, anchor] = link.split("#");
    const target = path ? join(dirname(file), path).replaceAll("\\", "/") : file;
    if (!existsSync(join(root, target))) {
      errors.push(`${file}: the link ${link} points at a file that does not exist`);
      continue;
    }
    const headings = parsed.get(target)?.headings;
    if (anchor && headings && !headings.includes(anchor)) {
      errors.push(`${file}: the link ${link} points at a heading that does not exist`);
    }
  }
}

const mermaidScript = createRequire(import.meta.url).resolve("mermaid/dist/mermaid.min.js");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.addScriptTag({ path: mermaidScript });
for (const { file, index, code } of diagrams) {
  const message = await page.evaluate(async (source) => {
    try {
      await globalThis.mermaid.parse(source);
      return null;
    } catch (error) {
      return String(error?.message ?? error);
    }
  }, code);
  if (message) errors.push(`${file}: Mermaid diagram ${index} does not parse\n  ${message.split("\n").join("\n  ")}`);
}
await browser.close();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) in the docs.`);
  process.exit(1);
}
console.log(`Checked ${files.length} files and ${diagrams.length} Mermaid diagrams. No problems.`);
