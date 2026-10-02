import { now, parishDayKey, parishDaysBetween } from "@/lib/parishTime";
import axios, { AxiosInstance } from "axios";

const HOST = "www.antiochian.org";
const CLIENT_ID = "antiochian_api";
const CLIENT_SECRET = "TAxhx@9tH(l^MgQ9FWE8}T@NWUT9U)";

export interface LiturgicalDay {
  originalCalendarDate: string;
  itemId: number;
  feastDayTitle: string;
  fastDesignation: string;
  reading1Title: string;
  reading2Title: string;
  reading3Title: string; // Optional third reading title
  reading1Teaser: string;
  reading2Teaser: string;
  reading3Teaser: string; // Optional third reading teaser
  reading1FullText: string;
  reading2FullText: string;
  reading3FullText: string; // Optional third reading full text
  [key: string]: any; // Catch any other unexpected fields
}

export interface LiturgicalText {
  publicUrl: string;
  typeOfService: string;
}

export interface ReadingTeasers {
  date: string;
  reading1Title: string;
  reading1Teaser: string;
  reading2Title: string;
  reading2Teaser: string;
  reading3Title: string;
  reading3Teaser: string;
}

export interface ReadingTexts {
  reading1FullText?: string;
  reading2FullText?: string;
  reading3FullText?: string;
}

export interface FeastTitle {
  feastTitle?: string;
}

export class Antiochian {
  private baseUrl = "https://antiochian.org/";
  private tokenEndpoint = `${this.baseUrl}connect/token`;
  private liturgicalDayEndpoint = (id: number) =>
    `${this.baseUrl}api/antiochian/LiturgicalDay/${id}`;
  private liturgicalTextEndpoint = (date: string) =>
    `${this.baseUrl}api/antiochian/LiturgicalTexts/${date}`;
  private axiosInstance: AxiosInstance;
  private idAnchor?: [Date, number];
  private days: Record<string, LiturgicalDay> = {};

  constructor() {
    this.axiosInstance = axios.create({
      headers: { Host: HOST },
    });
  }

  // Authenticate and set the authorization token
  async authenticate(): Promise<void> {
    const response = await this.axiosInstance.post(
      this.tokenEndpoint,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const tokenData = response.data;
    this.axiosInstance.defaults.headers["Authorization"] =
      `Bearer ${tokenData.access_token}`;
    await this.getLiturgicalDay(); // Populate idAnchor
  }

  // Authenticate only if the ID anchor has not been populated yet
  async ensureAuthenticated(): Promise<void> {
    if (!this.idAnchor) {
      await this.authenticate();
    }
  }

  // Get the liturgical day ID from a date
  private getIdFromDate(date: Date): number {
    if (!this.idAnchor) throw new Error("ID Anchor not initialized");
    const [anchorDate, anchorId] = this.idAnchor;
    // Whole parish calendar days, not 24-hour spans, so the time of day
    // (and daylight saving) never moves a date onto a neighbouring day.
    return parishDaysBetween(anchorDate, date) + anchorId;
  }

  // Fetch liturgical day information for a specific date
  async getLiturgicalDay(date?: Date): Promise<LiturgicalDay | null> {
    const key = date ? parishDayKey(date) : "0";
    if (this.days[key]) return this.days[key];

    const dayId = date ? this.getIdFromDate(date) : 0;
    const response = await this.axiosInstance.get(
      this.liturgicalDayEndpoint(dayId),
    );

    if (response.status !== 200) return null;

    // Raw data
    //console.log(`Raw response data for ${dt?.toDateString() || 'default'}:\n`, JSON.stringify(response.data, null, 2));

    const day: LiturgicalDay = response.data.liturgicalDay;

    if (!this.idAnchor) {
      const anchorDate = new Date(day.originalCalendarDate);
      this.idAnchor = [anchorDate, day.itemId];
    }

    this.days[key] = day; // Cache result
    return day;
  }

  // Fetch liturgical text data for a specific date
  async getLiturgicalText(date: Date): Promise<LiturgicalText[] | null> {
    const key = parishDayKey(date); // YYYY-MM-DD in the parish's time zone
    const response = await this.axiosInstance.get(
      this.liturgicalTextEndpoint(key),
    );

    if (response.status !== 200) return null;

    // TODO: Add a caching feature like getLiturgicalDay has

    const texts: LiturgicalText[] = response.data;
    return texts;
  }

  // Fetch both liturgical day and text data for a specific date
  async getLiturgicalData(
    date: Date,
  ): Promise<{ day: LiturgicalDay | null; texts: LiturgicalText[] | null }> {
    const day = await this.getLiturgicalDay(date);
    const texts = await this.getLiturgicalText(date);
    return { day, texts };
  }

  public getReadingTeasers(day: LiturgicalDay): ReadingTeasers {
    return {
      date: day.calendarDateLong,
      reading1Title: day.reading1Title.trimStart(),
      reading1Teaser: day.reading1Teaser.trimStart(),
      reading2Title: day.reading2Title.trimStart(),
      reading2Teaser: day.reading2Teaser.trimStart(),
      reading3Title: (day.reading3Title || "").trimStart(),
      reading3Teaser: (day.reading3Teaser || "").trimStart(),
    };
  }

  public getReadingTexts(day: LiturgicalDay): ReadingTexts {
    return {
      reading1FullText: day.reading1FullText?.trimStart(),
      reading2FullText: day.reading2FullText?.trimStart(),
      reading3FullText: day.reading3FullText?.trimStart(),
    };
  }

  public getFeastTitle(day: LiturgicalDay): FeastTitle {
    return {
      feastTitle: day.feastDayTitle?.trimStart(),
    };
  }
}

const antiochianInstance = new Antiochian();

/** @deprecated Use `liturgicalService` from `@/services/liturgical`. */
export const fetchAntiochian = async (date: Date = now()) => {
  await antiochianInstance.ensureAuthenticated();

  const [day, texts] = await Promise.all([
    antiochianInstance.getLiturgicalDay(date),
    antiochianInstance.getLiturgicalText(date),
  ]);

  return { day, texts };
};

/** @deprecated Use `liturgicalService` from `@/services/liturgical`. */
export const getReadingTeasers = (day: LiturgicalDay) =>
  antiochianInstance.getReadingTeasers(day);
/** @deprecated Use `liturgicalService` from `@/services/liturgical`. */
export const getReadingTexts = (day: LiturgicalDay) =>
  antiochianInstance.getReadingTexts(day);
/** @deprecated Use `liturgicalService` from `@/services/liturgical`. */
export const getFeastTitle = (day: LiturgicalDay) =>
  antiochianInstance.getFeastTitle(day);

// low-level access instance
export default antiochianInstance;
