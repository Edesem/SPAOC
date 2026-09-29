import type { LiturgicalData } from "@/domain/liturgical";

// Screens read the app-owned shapes, not any provider's.
export type {
  LiturgicalData,
  LiturgicalDay,
  LiturgicalService,
  Reading,
  ReadingKind,
} from "@/domain/liturgical";

// Single entry point for liturgical data. Screens and hooks depend on this
// interface rather than on a specific provider.
export interface LiturgicalDataService {
  // Fetch the liturgical day and services for a date (defaults to today)
  getLiturgicalData(date?: Date): Promise<LiturgicalData>;
}
