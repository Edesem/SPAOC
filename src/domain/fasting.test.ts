import {
  classifyFastingEvent,
  FastKind,
  getFast,
  getMajorLabel,
  getMinorLabel,
  prioritizeFasts,
} from "@/domain/fasting";

describe("classifyFastingEvent", () => {
  it.each([
    ["Strict Fast", FastKind.StrictFast],
    ["Fast", FastKind.Fast],
    ["Meat Fast", FastKind.MeatFast],
    ["Great Lent", FastKind.GreatLent],
    ["The Apostles' Fast", FastKind.ApostlesFast],
    ["The Theotokos Fast", FastKind.TheotokosFast],
    ["Nativity Fast", FastKind.NativityFast],
  ])("classifies %p", (title, kind) => {
    expect(classifyFastingEvent(title)).toBe(kind);
  });

  it("ignores capitalisation", () => {
    expect(classifyFastingEvent("strict FAST")).toBe(FastKind.StrictFast);
  });

  it.each(["Church Service", "", "Fast Day Lunch"])(
    "returns null for %p",
    (title) => {
      expect(classifyFastingEvent(title)).toBeNull();
    },
  );
});

describe("getFast", () => {
  it("pairs each kind with the label the Home screen shows", () => {
    expect(getFast(FastKind.TheotokosFast)).toEqual({
      kind: "theotokosFast",
      displayLabel: "Theotokos Fast",
    });
  });
});

describe("prioritizeFasts", () => {
  it("returns null when there is no major fast", () => {
    expect(prioritizeFasts([])).toBeNull();
    expect(prioritizeFasts([FastKind.Fast, FastKind.MeatFast])).toBeNull();
  });

  it.each([
    FastKind.GreatLent,
    FastKind.ApostlesFast,
    FastKind.TheotokosFast,
    FastKind.NativityFast,
  ])("returns %p when it is the only major fast", (kind) => {
    expect(prioritizeFasts([FastKind.Fast, kind])).toBe(kind);
  });

  it("ranks Great Lent over the Nativity Fast", () => {
    expect(prioritizeFasts([FastKind.NativityFast, FastKind.GreatLent])).toBe(
      FastKind.GreatLent,
    );
  });

  it("ranks the Apostles' Fast over the Theotokos and Nativity Fasts", () => {
    expect(
      prioritizeFasts([
        FastKind.NativityFast,
        FastKind.TheotokosFast,
        FastKind.ApostlesFast,
      ]),
    ).toBe(FastKind.ApostlesFast);
  });
});

describe("getMajorLabel", () => {
  it("is null without a major fast", () => {
    expect(getMajorLabel([FastKind.StrictFast])).toBeNull();
  });

  it.each([
    [FastKind.GreatLent, "Great Lent"],
    [FastKind.ApostlesFast, "The Apostles' Fast"],
    [FastKind.TheotokosFast, "Theotokos Fast"],
    [FastKind.NativityFast, "The Nativity Fast"],
  ])("labels %p", (kind, label) => {
    expect(getMajorLabel([kind])).toBe(label);
  });
});

describe("getMinorLabel", () => {
  it("says there is no fast when nothing is in effect", () => {
    expect(getMinorLabel([])).toBe("No Fast");
    expect(getMinorLabel([FastKind.GreatLent])).toBe("No Fast");
  });

  it("gives abstinence instructions for each minor fast", () => {
    expect(getMinorLabel([FastKind.StrictFast])).toBe(
      "Abstain from meat, fish, dairy, eggs, wine, olive oil",
    );
    expect(getMinorLabel([FastKind.Fast])).toBe(
      "Abstain from meat, dairy, eggs",
    );
    expect(getMinorLabel([FastKind.MeatFast])).toBe("Abstain from meat");
  });

  it("uses the strictest minor fast in effect", () => {
    expect(getMinorLabel([FastKind.MeatFast, FastKind.StrictFast])).toBe(
      "Abstain from meat, fish, dairy, eggs, wine, olive oil",
    );
    expect(getMinorLabel([FastKind.MeatFast, FastKind.Fast])).toBe(
      "Abstain from meat, dairy, eggs",
    );
  });
});

describe("calendar title to display label", () => {
  const labelsFor = (titles: string[]) => {
    const fasts = titles.flatMap((title) => classifyFastingEvent(title) ?? []);
    return { major: getMajorLabel(fasts), minor: getMinorLabel(fasts) };
  };

  it("labels a Nativity Fast entry as The Nativity Fast (#77)", () => {
    expect(labelsFor(["Nativity Fast", "Fast"])).toEqual({
      major: "The Nativity Fast",
      minor: "Abstain from meat, dairy, eggs",
    });
  });

  it("shows No Fast for entries that are not fasts", () => {
    expect(labelsFor(["Church Service"])).toEqual({
      major: null,
      minor: "No Fast",
    });
  });
});
