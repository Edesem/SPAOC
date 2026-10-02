import antiochianClient from "./AntiochianApi";
import { AntiochianLiturgicalService } from "./AntiochianLiturgicalService";
import type { LiturgicalDataService } from "./LiturgicalDataService";

export * from "./LiturgicalDataService";

// App-wide liturgical data service. Swap the implementation here to change
// provider without touching screens or hooks.
export const liturgicalService: LiturgicalDataService =
  new AntiochianLiturgicalService(antiochianClient);
