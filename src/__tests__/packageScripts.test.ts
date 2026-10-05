import { jest as jestConfig, scripts } from "../../package.json";

// `npm test` is what CI scripts and the structured workflow call. In watch
// mode it never exits without a TTY, so watch mode must stay opt-in.

describe("package.json test scripts", () => {
  it("runs the tests once with npm test", () => {
    expect(scripts.test).toBe("jest");
  });

  it("keeps watch mode behind npm run test:watch", () => {
    expect(scripts["test:watch"]).toBe("jest --watchAll");
  });

  it("does not need to switch watch mode off for coverage", () => {
    expect(scripts.coverage).not.toMatch(/watch/i);
  });

  it("still gates coverage on 80% of lines, in band", () => {
    expect(scripts.coverage).toContain("--coverage");
    expect(scripts.coverage).toContain("--runInBand");
    expect(scripts.coverage).toContain('"lines":80');
  });
});

describe("jest timeout", () => {
  // The first render in a screen test pays a cold module-load cost (about
  // 1s locally). CI runs about 3x slower, which put one test over the 5s
  // default (run 36946882155).
  it("allows more than the 5s default for a cold first render", () => {
    expect((jestConfig as { testTimeout?: number }).testTimeout).toBeGreaterThan(
      5000,
    );
  });
});
