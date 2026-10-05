import fs from "fs";
import path from "path";

const SRC = path.resolve(__dirname, "..");

// The notification modules still log; the reconcile work (#129) replaces that.
const ALLOWED_DIRS = [path.join(SRC, "features", "notifications")];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : sourceFiles(full);
    }
    const isSource = /\.tsx?$/.test(entry.name);
    const isTest = /\.test\.tsx?$/.test(entry.name);
    return isSource && !isTest ? [full] : [];
  });
}

/** Drops comments so a commented-out `console.log` is not reported. */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, "$1"))
    .join("\n");
}

describe("debug logging", () => {
  it("leaves no console.log outside the notification modules", () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => !ALLOWED_DIRS.some((dir) => file.startsWith(dir)))
      .filter((file) =>
        /console\.log\(/.test(stripComments(fs.readFileSync(file, "utf8"))),
      )
      .map((file) => path.relative(SRC, file));

    expect(offenders).toEqual([]);
  });
});
