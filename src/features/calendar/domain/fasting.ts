// The one place that knows which calendar entries are fasts, how they rank,
// and what the Home screen says about them.
export const FastKind = {
  StrictFast: "strictFast",
  Fast: "fast",
  MeatFast: "meatFast",
  GreatLent: "greatLent",
  ApostlesFast: "apostlesFast",
  TheotokosFast: "theotokosFast",
  NativityFast: "nativityFast",
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- a const and its union type share a name
export type FastKind = (typeof FastKind)[keyof typeof FastKind];

export interface Fast {
  kind: FastKind;
  displayLabel: string;
}

// `titles` are the lower-case calendar titles that mean this fast.
const FAST_DEFINITIONS: Record<FastKind, Fast & { titles: string[] }> = {
  strictFast: {
    kind: "strictFast",
    displayLabel: "Abstain from meat, fish, dairy, eggs, wine, olive oil",
    titles: ["strict fast"],
  },
  fast: {
    kind: "fast",
    displayLabel: "Abstain from meat, dairy, eggs",
    titles: ["fast"],
  },
  meatFast: {
    kind: "meatFast",
    displayLabel: "Abstain from meat",
    titles: ["meat fast"],
  },
  greatLent: {
    kind: "greatLent",
    displayLabel: "Great Lent",
    titles: ["great lent"],
  },
  apostlesFast: {
    kind: "apostlesFast",
    displayLabel: "The Apostles' Fast",
    titles: ["the apostles' fast"],
  },
  theotokosFast: {
    kind: "theotokosFast",
    displayLabel: "Theotokos Fast",
    titles: ["the theotokos fast"],
  },
  nativityFast: {
    kind: "nativityFast",
    displayLabel: "The Nativity Fast",
    titles: ["nativity fast"],
  },
};

// A stricter or longer fast takes precedence over the others in effect.
const MAJOR_FASTS: FastKind[] = [
  "greatLent",
  "apostlesFast",
  "theotokosFast",
  "nativityFast",
];

// Strictest first: the day's abstinence rule is the strictest one in effect.
const MINOR_FASTS: FastKind[] = ["strictFast", "fast", "meatFast"];

const NO_FAST_LABEL = "No Fast";

export const getFast = (kind: FastKind): Fast => {
  const { displayLabel } = FAST_DEFINITIONS[kind];
  return { kind, displayLabel };
};

// Which fast a calendar entry's title describes, or null if it isn't one.
export const classifyFastingEvent = (
  calendarTitle: string,
): FastKind | null => {
  const title = calendarTitle.toLowerCase();
  const match = Object.values(FAST_DEFINITIONS).find((fast) =>
    fast.titles.includes(title),
  );
  return match?.kind ?? null;
};

// The major fast in effect, if any.
export const prioritizeFasts = (fasts: FastKind[]): FastKind | null =>
  MAJOR_FASTS.find((kind) => fasts.includes(kind)) ?? null;

export const getMajorLabel = (fasts: FastKind[]): string | null => {
  const major = prioritizeFasts(fasts);
  return major ? getFast(major).displayLabel : null;
};

// What to abstain from today: the strictest minor fast's rule, else "No Fast".
export const getMinorLabel = (fasts: FastKind[]): string => {
  const minor = MINOR_FASTS.find((kind) => fasts.includes(kind));
  return minor ? getFast(minor).displayLabel : NO_FAST_LABEL;
};
