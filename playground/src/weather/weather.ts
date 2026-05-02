import { View, Div, Form, Input, Button, H3, P, effect, type Element } from '@matthewp/zebra';
import { WeatherModel } from './weather-model.ts';

export class Weather extends View {
  model: WeatherModel;

  constructor(model: WeatherModel = new WeatherModel()) {
    super();
    this.model = model;
  }

  render(): Element {
    const root = new Div().addClass('weather');

    const form = new Form().addClass('weather-form');
    const zipInput = new Input()
      .addClass('zip')
      .setAttribute('type', 'text')
      .setAttribute('placeholder', 'Enter ZIP code')
      .setValue(this.model.zip());
    const submit = new Button().setAttribute('type', 'submit').setText('Get Weather');
    form.append(zipInput, submit);

    form.on('submit', (e) => {
      e.preventDefault();
      const zip = zipInput.getValue().trim();
      if (zip) this.model.load(zip);
    });

    const status = new P().addClass('weather-status');

    const display = new Div().addClass('weather-display');
    const area = new H3().addClass('weather-area');
    const temp = new P().addClass('weather-temp');
    const desc = new P().addClass('weather-desc');
    const feels = new P().addClass('weather-feels');
    const humidity = new P().addClass('weather-humidity');
    display.append(area, temp, desc, feels, humidity);

    effect(() => {
      if (this.model.loading()) {
        status.setText('Loading…').show();
      } else if (this.model.error()) {
        status.setText(this.model.error()!).show();
      } else {
        status.hide();
      }
    });

    effect(() => {
      const d = this.model.data();
      if (d) {
        area.setText(`${d.area}, ${d.state} (${this.model.zip()})`);
        temp.setText(`${d.tempF}°F`);
        desc.setText(d.description);
        feels.setText(`Feels like ${d.feelsLikeF}°F`);
        humidity.setText(`Humidity: ${d.humidity}%`);
        display.show();
      } else {
        display.hide();
      }
    });

    root.append(form, status, display);
    return root;
  }
}

export default Weather;
