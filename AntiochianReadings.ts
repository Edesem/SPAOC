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
    reading1Title: string;
    reading2Title: string;
    reading1Teaser: string;
    reading2Teaser: string;
    reading1FullText: string;
    reading2FullText: string;
    [key: string]: any;  // Catch any other unexpected fields
}

interface ReadingTeasers {
    date: string;
    reading1Title: string; 
    reading1Teaser: string; 
    reading2Title: string; 
    reading2Teaser: string;
}

class Antiochian {
    private baseUrl = 'https://antiochian.org/';
    private tokenEndpoint = `${this.baseUrl}connect/token`;
    private liturgicalEndpoint = (id: number) => `${this.baseUrl}api/antiochian/LiturgicalDay/${id}`;
    private axiosInstance: AxiosInstance;
    private idAnchor?: [Date, number];
    private days: Record<string, LiturgicalDay> = {};

    constructor() {
        this.axiosInstance = axios.create({
            headers: { 'Host': HOST }
        });
    }

    async authenticate(): Promise<void> {
        const response = await this.axiosInstance.post(this.tokenEndpoint, new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokenData = response.data;
        this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${tokenData.access_token}`;
        await this.getLiturgicalDay(); // Populate idAnchor
    }

    private getIdFromDate(dt: Date): number {
        if (!this.idAnchor) throw new Error('ID Anchor not initialized');
        const [anchorDate, anchorId] = this.idAnchor;
        const span = Math.floor((dt.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
        return span + anchorId;
    }

    async getLiturgicalDay(dt?: Date): Promise<LiturgicalDay | null> {
        const key = dt ? dt.toISOString().split('T')[0] : '0';
        if (this.days[key]) return this.days[key];

        const dayId = dt ? this.getIdFromDate(dt) : 0;
        const response = await this.axiosInstance.get(this.liturgicalEndpoint(dayId));

        if (response.status !== 200) return null;

        //console.log(`Raw response data for ${dt?.toDateString() || 'default'}:\n`, JSON.stringify(response.data, null, 2));

        const day: LiturgicalDay = response.data.liturgicalDay;

        if (!this.idAnchor) {
            const anchorDate = new Date(day.originalCalendarDate);
            this.idAnchor = [anchorDate, day.itemId];
        }

        this.days[key] = day; // Cache result
        return day;
    }

    getReadingTeasers(day: LiturgicalDay): ReadingTeasers {
        return {
            date: day.calendarDateLong,
            reading1Title: day.reading1Title,
            reading1Teaser: day.reading1Teaser,
            reading2Title: day.reading2Title,
            reading2Teaser: day.reading2Teaser,
        };
    }

    getReadingTexts(day: LiturgicalDay): { reading1FullText?: string; reading2FullText?: string } {
        return {
            reading1FullText: day.reading1FullText,
            reading2FullText: day.reading2FullText,
        };
    }
}

export const fetchReadingsTeaser = async () => {
    const session = new Antiochian();
    await session.authenticate();
    const day = await session.getLiturgicalDay(getCurrentDate());
    if (day) {
        return session.getReadingTeasers(day);
    }
}

export const fetchReadingsText = async () => {
    const session = new Antiochian();
    await session.authenticate();
    const day = await session.getLiturgicalDay(getCurrentDate());
    if (day) {
        return session.getReadingTexts(day);
    }
}


