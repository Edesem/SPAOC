import axios, { AxiosInstance } from 'axios';
import { getCurrentDate } from './utils/dateUtils';

const HOST = 'www.antiochian.org';
const CLIENT_ID = 'antiochian_api';
const CLIENT_SECRET = 'TAxhx@9tH(l^MgQ9FWE8}T@NWUT9U)';

interface LiturgicalDay {
  originalCalendarDate: string;
  itemId: number;
  feastDayTitle: string;
  fastDesignation: string;
  reading1Title?: string;
  reading2Title?: string;
  reading3Title?: string;
}

interface LiturgicalText {
  publicUrl: string;
  typeOfService: string;
}

class Antiochian {
  private baseUrl = 'https://antiochian.org/';
  private tokenEndpoint = `${this.baseUrl}connect/token`;
  private liturgicalDayEndpoint = (id: number) => `${this.baseUrl}api/antiochian/LiturgicalDay/${id}`;
  private liturgicalTextEndpoint = (date: string) => `${this.baseUrl}api/antiochian/LiturgicalTexts/${date}`;
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
        grant_type: 'client_credentials',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const tokenData = response.data;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${tokenData.access_token}`;
    await this.getLiturgicalDay(); // Populate idAnchor
  }

  // Get the liturgical day ID from a date
  private getIdFromDate(dt: Date): number {
    if (!this.idAnchor) throw new Error('ID Anchor not initialized');
    const [anchorDate, anchorId] = this.idAnchor;
    const span = Math.floor((dt.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
    return span + anchorId;
  }

  // Fetch liturgical day information for a specific date
  async getLiturgicalDay(dt?: Date): Promise<LiturgicalDay | null> {
    const key = dt ? dt.toISOString().split('T')[0] : '0';
    if (this.days[key]) return this.days[key];

    const dayId = dt ? this.getIdFromDate(dt) : 0;
    const response = await this.axiosInstance.get(this.liturgicalDayEndpoint(dayId));

    if (response.status !== 200) return null;

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
    const key = date.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD
    const response = await this.axiosInstance.get(this.liturgicalTextEndpoint(key));

    if (response.status !== 200) return null;

    const texts: LiturgicalText[] = response.data;
    return texts;
  }

  // Fetch both liturgical day and text data for a specific date
  async getLiturgicalData(date: Date): Promise<{ day: LiturgicalDay | null; texts: LiturgicalText[] | null }> {
    const day = await this.getLiturgicalDay(date);
    const texts = await this.getLiturgicalText(date);
    return { day, texts };
  }
}

export const fetchLiturgicalTexts = async () => {
  const session = new Antiochian();
  await session.authenticate();
  return session.getLiturgicalText(getCurrentDate());
};