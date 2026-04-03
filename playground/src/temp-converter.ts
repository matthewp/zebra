import { View } from '@matthewp/zebra';

export class TempConverter extends View {
  celsius: number | undefined = undefined;
  fahrenheit: number | undefined = undefined;

  celsiusNode!: HTMLInputElement;
  fahrenheitNode!: HTMLInputElement;

  template() {
    return `<div class="temp-converter">
      <label>Celsius <input class="celsius" type="number"></label>
      <span class="arrow">=</span>
      <label>Fahrenheit <input class="fahrenheit" type="number"></label>
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.celsiusNode = el.querySelector('.celsius') as HTMLInputElement;
    this.fahrenheitNode = el.querySelector('.fahrenheit') as HTMLInputElement;

    this.celsiusNode.addEventListener('input', () => this.onCelsiusInput());
    this.fahrenheitNode.addEventListener('input', () => this.onFahrenheitInput());
  }

  setCelsius(value: number) {
    if (this.celsius !== value) {
      this.celsius = value;
      this.celsiusNode.value = String(value);
      let f = Math.round(value * 9 / 5 + 32);
      this.fahrenheit = f;
      this.fahrenheitNode.value = String(f);
    }
  }

  setFahrenheit(value: number) {
    if (this.fahrenheit !== value) {
      this.fahrenheit = value;
      this.fahrenheitNode.value = String(value);
      let c = Math.round((value - 32) * 5 / 9);
      this.celsius = c;
      this.celsiusNode.value = String(c);
    }
  }

  onCelsiusInput() {
    this.setCelsius(Number(this.celsiusNode.value));
  }

  onFahrenheitInput() {
    this.setFahrenheit(Number(this.fahrenheitNode.value));
  }

  update(data: { celsius?: number; fahrenheit?: number } = {}) {
    if ('celsius' in data) this.setCelsius(data.celsius!);
    if ('fahrenheit' in data) this.setFahrenheit(data.fahrenheit!);
    return this.el;
  }
}

export default TempConverter;
