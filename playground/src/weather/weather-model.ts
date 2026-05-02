import { signal, Model } from '@matthewp/zebra';

export interface WeatherData {
  area: string;
  state: string;
  tempF: number;
  feelsLikeF: number;
  humidity: number;
  description: string;
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export class WeatherModel extends Model {
  zip = signal('');
  data = signal<WeatherData | null>(null);

  async load(zip: string) {
    this.zip(zip);
    await this.run(async () => {
      const zipRes = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
      if (!zipRes.ok) throw new Error(`ZIP ${zip} not found`);
      const zipJson = await zipRes.json();
      const place = zipJson.places[0];
      const lat = Number(place.latitude);
      const lon = Number(place.longitude);

      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit`;
      const wxRes = await fetch(wxUrl);
      if (!wxRes.ok) throw new Error(`Weather lookup failed (${wxRes.status})`);
      const wxJson = await wxRes.json();
      const c = wxJson.current;

      this.data({
        area: place['place name'],
        state: place['state abbreviation'],
        tempF: Math.round(c.temperature_2m),
        feelsLikeF: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        description: WEATHER_CODES[c.weather_code] ?? 'Unknown',
      });
    });
  }
}
