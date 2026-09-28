import type { Antiochian } from "@/api/AntiochianApi";
import type {
  FeastTitle,
  LiturgicalData,
  LiturgicalDataService,
  LiturgicalDay,
  ReadingTeasers,
  ReadingTexts,
} from "./LiturgicalDataService";

export type AntiochianClient = Pick<
  Antiochian,
  | "ensureAuthenticated"
  | "getLiturgicalDay"
  | "getLiturgicalText"
  | "getReadingTeasers"
  | "getReadingTexts"
  | "getFeastTitle"
>;

// LiturgicalDataService backed by the Antiochian Archdiocese API
export class AntiochianLiturgicalService implements LiturgicalDataService {
  constructor(private readonly client: AntiochianClient) {}

  async getLiturgicalData(date: Date = new Date()): Promise<LiturgicalData> {
    await this.client.ensureAuthenticated();

    const [day, texts] = await Promise.all([
      this.client.getLiturgicalDay(date),
      this.client.getLiturgicalText(date),
    ]);

    return { day, texts };
  }

  getReadingTeasers(day: LiturgicalDay): ReadingTeasers {
    return this.client.getReadingTeasers(day);
  }

  getReadingTexts(day: LiturgicalDay): ReadingTexts {
    return this.client.getReadingTexts(day);
  }

  getFeastTitle(day: LiturgicalDay): FeastTitle {
    return this.client.getFeastTitle(day);
  }
}
