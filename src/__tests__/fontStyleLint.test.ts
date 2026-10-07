import { spawnSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

const SCREEN = "src/features/calendar/screens/Example.ts";

type LintCase = { name: string; file: string; code: string };

const REJECTED: LintCase[] = [
  {
    name: "fontFamily in a screen",
    file: SCREEN,
    code: 'export const s = { fontFamily: "Alegreya" };',
  },
  {
    name: "fontWeight in a screen",
    file: SCREEN,
    code: 'export const s = { fontWeight: "600" };',
  },
  {
    name: "fontStyle in a screen",
    file: SCREEN,
    code: 'export const s = { fontStyle: "italic" };',
  },
  {
    name: "a quoted fontWeight key in a screen",
    file: SCREEN,
    code: 'export const s = { "fontWeight": "bold" };',
  },
];

const ALLOWED: LintCase[] = [
  {
    name: "fontSize, which icons still set themselves",
    file: SCREEN,
    code: "export const s = { fontSize: 36 };",
  },
  {
    name: "the typography module defining families, weights and styles",
    file: "src/theme/typography.ts",
    code: 'export const s = { fontFamily: "Alegreya", fontWeight: "700", fontStyle: "italic" };',
  },
  {
    name: "a test asserting on families and weights",
    file: "src/features/calendar/screens/Example.test.tsx",
    code: 'export const s = { fontFamily: "Alegreya", fontWeight: "700" };',
  },
];

// ESLint 9 loads eslint.config.js with a dynamic import(), which Jest's module
// sandbox can't run, so the repo's own config is applied in a plain Node
// process. One process lints every case, because starting it is the slow part.
const LINT_SCRIPT = `
const { ESLint } = require("eslint");
let input = "";
process.stdin.on("data", (chunk) => (input += chunk)).on("end", async () => {
  const eslint = new ESLint({ cwd: process.cwd() });
  const out = [];
  for (const { file, code } of JSON.parse(input)) {
    const [result] = await eslint.lintText(code, { filePath: file });
    out.push(
      result.messages
        .filter((message) => message.ruleId === "no-restricted-syntax")
        .map((message) => message.message),
    );
  }
  process.stdout.write(JSON.stringify(out));
});
`;

function lintAll(cases: LintCase[]): string[][] {
  const result = spawnSync(process.execPath, ["-e", LINT_SCRIPT], {
    cwd: ROOT,
    encoding: "utf8",
    input: JSON.stringify(
      cases.map(({ file, code }) => ({
        file: path.join(ROOT, file),
        code,
      })),
    ),
  });
  if (result.status !== 0) {
    throw new Error(`ESLint run failed: ${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

describe("inline font style lint rule", () => {
  let messages: Record<string, string[]>;

  beforeAll(() => {
    const cases = [...REJECTED, ...ALLOWED];
    const results = lintAll(cases);
    messages = Object.fromEntries(
      cases.map(({ name }, index) => [name, results[index]]),
    );
  }, 60000);

  it.each(REJECTED.map(({ name }) => name))("rejects %s", (name) => {
    expect(messages[name]).toHaveLength(1);
    expect(messages[name][0]).toMatch(/@\/theme\/typography/);
  });

  it.each(ALLOWED.map(({ name }) => name))("allows %s", (name) => {
    expect(messages[name]).toEqual([]);
  });
});
