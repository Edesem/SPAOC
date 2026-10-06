import fs from "fs";
import path from "path";

// IconSymbol renders SF Symbols on iOS and falls back to MaterialIcons through
// a hand-kept map. Its types accept any SF Symbol name, so a name missing from
// the map compiles and then shows a blank icon on Android. This keeps the map
// complete for every icon the app uses.

const src = path.resolve(__dirname, "../..");

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)
      ? [full]
      : [];
  });

const usedIconNames = (): string[] =>
  sourceFiles(src).flatMap((file) =>
    [
      ...fs
        .readFileSync(file, "utf8")
        .matchAll(/<IconSymbol\b[^>]*?\bname="([^"]+)"/gs),
    ].map((match) => match[1]),
  );

describe("IconSymbol Android fallback", () => {
  const androidSource = fs.readFileSync(
    path.join(__dirname, "IconSymbol.tsx"),
    "utf8",
  );

  it("finds the icons the app uses", () => {
    expect(usedIconNames()).toEqual(
      expect.arrayContaining(["calendar", "map.fill"]),
    );
  });

  it.each([...new Set(usedIconNames())])(
    "maps the %s symbol to a MaterialIcons name",
    (name) => {
      expect(androidSource).toMatch(
        new RegExp(`["']?${name.replace(/\./g, "\\.")}["']?:\\s*"[a-z-]+"`),
      );
    },
  );
});
