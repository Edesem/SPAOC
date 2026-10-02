import type { Antiochian } from "@/api/AntiochianApi";
import type { LiturgicalData } from "@/domain/liturgical";
import { now } from "@/lib/parishTime";
import { mapLiturgicalDay, mapServices } from "./antiochianMapper";
import type { LiturgicalDataService } from "./LiturgicalDataService";

export type AntiochianClient = Pick<
  Antiochian,
  "ensureAuthenticated" | "getLiturgicalDay" | "getLiturgicalText"
>;

// LiturgicalDataService backed by the Antiochian Archdiocese API
export class AntiochianLiturgicalService implements LiturgicalDataService {
  constructor(private readonly client: AntiochianClient) {}

  async getLiturgicalData(date: Date = now()): Promise<LiturgicalData> {
    await this.client.ensureAuthenticated();

    const [day, texts] = await Promise.all([
      this.client.getLiturgicalDay(date),
      this.client.getLiturgicalText(date),
    ]);

    return {
      day: day ? mapLiturgicalDay(day) : null,
      services: texts ? mapServices(texts) : null,
    };
  }
}
