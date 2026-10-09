import type { Reading } from "./liturgical";

const BY_KIND: Record<Reading["kind"], string> = {
  epistle: "The Epistle",
  gospel: "The Gospel",
  thirdReading: "The Third Reading",
};

const BY_PLACE = ["First Reading", "Second Reading", "Third Reading"];

// The label above each reading card. The Epistle and the Gospel are named for
// what they are, but once a day has a third reading none of them is more the
// Epistle than another, so all are named by their place in the order.
export function readingLabels(readings: Reading[]): string[] {
  if (readings.length > 2) {
    return readings.map(
      (_, index) => BY_PLACE[index] ?? `Reading ${index + 1}`,
    );
  }
  return readings.map((reading) => BY_KIND[reading.kind]);
}
