import axios from 'axios';

interface LiturgicalData {
  publicUrl: string;
  typeOfService: string;
}

class Antiochian {
  private baseUrl = 'https://antiochian.org/';
  private tokenEndpoint = `${this.baseUrl}connect/token`;
  private liturgicalTextEndpoint = (date: string) => `${this.baseUrl}api/antiochian/LiturgicalTexts/${date}`;
  private axiosInstance = axios.create({
    headers: { 'Host': 'www.antiochian.org' }
  });

  // Authenticate and set the authorization token
  async authenticate(): Promise<void> {
    const response = await this.axiosInstance.post(this.tokenEndpoint, new URLSearchParams({
      client_id: 'antiochian_api',
      client_secret: 'TAxhx@9tH(l^MgQ9FWE8}T@NWUT9U)',
      grant_type: 'client_credentials',
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const tokenData = response.data;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${tokenData.access_token}`;
  }

  // Fetch liturgical text data for a specific date
  async getLiturgicalText(date: Date): Promise<{ typeOfService: string; publicUrl: string }[] | null> {
    const key = date.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD
    const response = await this.axiosInstance.get(this.liturgicalTextEndpoint(key));

    if (response.status !== 200) return null;

    const texts: LiturgicalData[] = response.data;
    return texts.map(text => ({
      typeOfService: text.typeOfService,
      publicUrl: text.publicUrl
    }));
  }
}

// Function to fetch current date in 'YYYY-MM-DD' format
export const getCurrentDate = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // Convert offset to milliseconds
  const localISODate = new Date(now - offset).toISOString().split('T')[0]; // Extract YYYY-MM-DD
  return localISODate;
};

export const fetchLiturgicalTexts = async () => {
  const session = new Antiochian();
  await session.authenticate();
  return session.getLiturgicalText(new Date());
};
