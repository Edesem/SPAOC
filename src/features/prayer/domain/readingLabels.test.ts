import type { Reading, ReadingKind } from "./liturgical";
import { readingLabels } from "./readingLabels";

const reading = (kind: ReadingKind): Reading => ({
  kind,
  title: kind,
  teaser: "",
  fullText: "",
});

describe("readingLabels", () => {
  it("names two readings the Epistle and the Holy Gospel", () => {
    expect(readingLabels([reading("epistle"), reading("gospel")])).toEqual([
      "The Epistle",
      "The Holy Gospel",
    ]);
  });

  it("names three readings by their place in the order", () => {
    expect(
      readingLabels([
        reading("epistle"),
        reading("gospel"),
        reading("thirdReading"),
      ]),
    ).toEqual(["First Reading", "Second Reading", "Third Reading"]);
  });

  it("still names a lone gospel by what it is", () => {
    expect(readingLabels([reading("gospel")])).toEqual(["The Holy Gospel"]);
  });

  it("gives no labels when there are no readings", () => {
    expect(readingLabels([])).toEqual([]);
  });
});
