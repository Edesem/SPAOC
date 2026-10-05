import fs from "fs";
import path from "path";

// Docs rot quietly when files move. These tests keep README.md, CLAUDE.md and
// everything under docs/ pointing at files that exist.

const root = path.resolve(__dirname, "../..");

const markdownFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });

const docs = [
  path.join(root, "README.md"),
  path.join(root, "CLAUDE.md"),
  ...markdownFiles(path.join(root, "docs")),
];

const linkTargets = (markdown: string): string[] =>
  [...markdown.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1])
    .filter((target) => !/^([a-z][a-z0-9+.-]*:|#)/i.test(target))
    .map((target) => target.split("#")[0]);

describe("markdown docs", () => {
  it.each(docs.map((file) => [path.relative(root, file), file]))(
    "%s links only to files that exist",
    (_name, file) => {
      const missing = linkTargets(fs.readFileSync(file, "utf8")).filter(
        (target) => !fs.existsSync(path.resolve(path.dirname(file), target)),
      );
      expect(missing).toEqual([]);
    },
  );

  it.each(docs.map((file) => [path.relative(root, file), file]))(
    "%s has no absolute paths into a local checkout",
    (_name, file) => {
      expect(fs.readFileSync(file, "utf8")).not.toMatch(/\/Users\/|\.worktrees/);
    },
  );

  it("only names markdown files in CLAUDE.md that exist", () => {
    const claude = fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8");
    const named = [...claude.matchAll(/`([\w./-]+\.md)`/g)].map((m) => m[1]);
    const missing = named.filter(
      (name) =>
        !fs.existsSync(path.join(root, name)) &&
        !fs.existsSync(path.join(root, "docs", name)),
    );
    expect(missing).toEqual([]);
  });

  it("is linked from the README", () => {
    const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
    expect(linkTargets(readme)).toContain("docs/notification-planner.md");
  });
});
