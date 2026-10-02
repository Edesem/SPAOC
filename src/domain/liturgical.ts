// The app's own view of a liturgical day. Providers map into these shapes at
// the service boundary, so screens never see a provider's field names.

// Matches the `type` the daily readings screen is given.
export type ReadingKind = "epistle" | "gospel" | "thirdReading";

// A reading exists only with both a title and its full text; providers that
// omit either one simply produce no reading.
export interface Reading {
  kind: ReadingKind;
  title: string;
  teaser: string;
  fullText: string;
}

// A service book the parish can open, e.g. "Great Vespers" with its PDF.
export interface LiturgicalService {
  title: string;
  pdfUrl: string;
}

export interface LiturgicalDay {
  feastTitle: string | null;
  // In reading order: epistle, gospel, then a third reading when there is one
  readings: Reading[];
}

export interface LiturgicalData {
  day: LiturgicalDay | null;
  // null when the provider had no service listing for the date
  services: LiturgicalService[] | null;
}
