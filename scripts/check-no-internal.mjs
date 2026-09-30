// Fails when any denylisted term appears in the repo (whole word, case-insensitive).
// Terms are never committed: set CODEFLOOR_DENYLIST (comma-separated) or keep an untracked .internal-denylist file.
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SKIP = new Set(["node_modules", "dist", "dist-app", ".git", ".superpowers", "app"]);
const DENYLIST = ".internal-denylist";

function walk(dir, root, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, root, out);
    else out.push(relative(root, full).split(sep).join("/"));
  }
  return out;
}

function listFiles(root) {
  try {
    return execSync("git ls-files --cached --others --exclude-standard", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .split("\n")
      .filter(Boolean);
  } catch {
    return walk(root, root, []);
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function loadTerms(root, env = process.env) {
  const parse = (text, sepRe) =>
    text
      .split(sepRe)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  if (env.CODEFLOOR_DENYLIST) return parse(env.CODEFLOOR_DENYLIST, /,/);
  try {
    return parse(readFileSync(join(root, DENYLIST), "utf8"), /\n/);
  } catch {
    return [];
  }
}

export function findInternalTerms(rootDir, terms) {
  const patterns = terms.map((term) => ({ term, re: new RegExp(`\\b${escapeRe(term)}\\b`, "i") }));
  const hits = [];
  for (const file of listFiles(rootDir)) {
    if (file === DENYLIST || file === "package-lock.json") continue;
    let text;
    try {
      text = readFileSync(join(rootDir, file), "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((line, i) => {
      for (const { term, re } of patterns)
        if (re.test(line)) hits.push({ file, line: i + 1, term });
    });
  }
  return hits;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const terms = loadTerms(root);
  if (terms.length === 0) {
    console.log("check:internal skipped (no CODEFLOOR_DENYLIST or .internal-denylist)");
    process.exit(0);
  }
  const hits = findInternalTerms(root, terms);
  for (const h of hits) console.error(`${h.file}:${h.line} contains "${h.term}"`);
  if (hits.length) process.exit(1);
  console.log("check:internal ok");
}
