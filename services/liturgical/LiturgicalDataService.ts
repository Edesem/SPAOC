import type {
  FeastTitle,
  LiturgicalDay,
  LiturgicalText,
  ReadingTeasers,
  ReadingTexts,
} from "@/api/AntiochianApi";

// Data shapes are re-exported unchanged so the UI keeps receiving the same
// objects it did when it called the Antiochian API directly.
export type {
  FeastTitle,
  LiturgicalDay,
  LiturgicalText,
  ReadingTeasers,
  ReadingTexts,
};

export interface LiturgicalData {
  day: LiturgicalDay | null;
  texts: LiturgicalText[] | null;
}

// Single entry point for liturgical data. Screens and hooks depend on this
// interface rather than on a specific provider.
export interface LiturgicalDataService {
  // Fetch the liturgical day and service texts for a date (defaults to today)
  getLiturgicalData(date?: Date): Promise<LiturgicalData>;
  getReadingTeasers(day: LiturgicalDay): ReadingTeasers;
  getReadingTexts(day: LiturgicalDay): ReadingTexts;
  getFeastTitle(day: LiturgicalDay): FeastTitle;
}
