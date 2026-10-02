import type {
  LiturgicalDay as AntiochianDay,
  LiturgicalText as AntiochianText,
} from "./AntiochianApi";
import type {
  LiturgicalDay,
  LiturgicalService,
  Reading,
  ReadingKind,
} from "../domain/liturgical";

// The provider pads many fields with leading whitespace.
const clean = (value: string | undefined | null): string =>
  value?.trimStart() ?? "";

const READING_SLOTS: { kind: ReadingKind; slot: 1 | 2 | 3 }[] = [
  { kind: "epistle", slot: 1 },
  { kind: "gospel", slot: 2 },
  { kind: "thirdReading", slot: 3 },
];

const mapReading = (
  day: AntiochianDay,
  kind: ReadingKind,
  slot: 1 | 2 | 3,
): Reading | null => {
  const title = clean(day[`reading${slot}Title`]);
  const fullText = clean(day[`reading${slot}FullText`]);
  if (!title || !fullText) return null;

  return { kind, title, teaser: clean(day[`reading${slot}Teaser`]), fullText };
};

export const mapLiturgicalDay = (day: AntiochianDay): LiturgicalDay => ({
  feastTitle: clean(day.feastDayTitle) || null,
  readings: READING_SLOTS.flatMap(({ kind, slot }) => {
    const reading = mapReading(day, kind, slot);
    return reading ? [reading] : [];
  }),
});

const PDF_SUFFIX = /\s*\(PDF\)$/;

// Keep the PDF entries, titled without their "(PDF)" suffix. A service listed
// twice keeps its first position and its last URL.
export const mapServices = (texts: AntiochianText[]): LiturgicalService[] => {
  const byTitle = new Map<string, LiturgicalService>();

  texts.forEach(({ publicUrl, typeOfService }) => {
    if (!publicUrl || !typeOfService.includes("PDF")) return;
    const title = typeOfService.replace(PDF_SUFFIX, "");
    byTitle.set(title, { title, pdfUrl: publicUrl });
  });

  return [...byTitle.values()];
};
