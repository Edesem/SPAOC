import type {
  LiturgicalDay as AntiochianDay,
  LiturgicalText,
} from "@/api/AntiochianApi";
import { mapLiturgicalDay, mapServices } from "./antiochianMapper";

const day = (extra: Partial<AntiochianDay> = {}): AntiochianDay => ({
  originalCalendarDate: "2026-08-13T00:00:00.000Z",
  itemId: 1,
  feastDayTitle: "  Dormition",
  fastDesignation: "",
  reading1Title: "  Romans 8",
  reading1Teaser: "  Teaser 1",
  reading1FullText: "  Text 1",
  reading2Title: "  Matthew 14",
  reading2Teaser: "  Teaser 2",
  reading2FullText: "  Text 2",
  reading3Title: "",
  reading3Teaser: "",
  reading3FullText: "",
  ...extra,
});

describe("mapLiturgicalDay", () => {
  it("maps trimmed readings in order with their kinds", () => {
    expect(mapLiturgicalDay(day())).toEqual({
      feastTitle: "Dormition",
      readings: [
        {
          kind: "epistle",
          title: "Romans 8",
          teaser: "Teaser 1",
          fullText: "Text 1",
        },
        {
          kind: "gospel",
          title: "Matthew 14",
          teaser: "Teaser 2",
          fullText: "Text 2",
        },
      ],
    });
  });

  it("does not expose provider fields the app doesn't use", () => {
    expect(
      Object.keys(mapLiturgicalDay(day({ somethingNew: "x" }))).sort(),
    ).toEqual(["feastTitle", "readings"]);
  });

  it("treats a whitespace-only title or text as missing", () => {
    const mapped = mapLiturgicalDay(
      day({ reading1Title: "   ", reading2FullText: "  \n" }),
    );

    expect(mapped.readings).toEqual([]);
  });

  it("defaults a missing teaser to an empty string", () => {
    const mapped = mapLiturgicalDay(
      day({ reading1Teaser: undefined as unknown as string }),
    );

    expect(mapped.readings[0].teaser).toBe("");
  });

  it("maps an empty feast title to null", () => {
    expect(
      mapLiturgicalDay(day({ feastDayTitle: "  " })).feastTitle,
    ).toBeNull();
  });
});

describe("mapServices", () => {
  const text = (typeOfService: string, publicUrl: string): LiturgicalText => ({
    typeOfService,
    publicUrl,
  });

  it("keeps PDF services and drops the (PDF) suffix from titles", () => {
    expect(
      mapServices([text("Great Vespers (PDF)", "https://files/v.pdf")]),
    ).toEqual([{ title: "Great Vespers", pdfUrl: "https://files/v.pdf" }]);
  });

  it("drops entries that are not PDFs or have no URL", () => {
    expect(
      mapServices([
        text("Matins Audio", "https://files/m.mp3"),
        text("Vespers (PDF)", ""),
      ]),
    ).toEqual([]);
  });

  it("keeps the first position and last URL of a repeated service", () => {
    expect(
      mapServices([
        text("Matins (PDF)", "https://files/old.pdf"),
        text("Vespers (PDF)", "https://files/v.pdf"),
        text("Matins (PDF)", "https://files/new.pdf"),
      ]),
    ).toEqual([
      { title: "Matins", pdfUrl: "https://files/new.pdf" },
      { title: "Vespers", pdfUrl: "https://files/v.pdf" },
    ]);
  });

  it("returns an empty list for no texts", () => {
    expect(mapServices([])).toEqual([]);
  });
});
