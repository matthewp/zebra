import { View, Div, Label, Input, Span, signal, effect, type Element } from '@matthewp/zebra';

export class TempConverter extends View {
  celsius = signal<number | undefined>(undefined);
  fahrenheit = signal<number | undefined>(undefined);

  render(): Element {
    const root = new Div().addClass('temp-converter');

    const celsiusInput = new Input().addClass('celsius').setAttribute('type', 'number');
    const celsiusLabel = new Label().append('Celsius ', celsiusInput);
    const arrow = new Span().addClass('arrow').setText('=');
    const fahrenheitInput = new Input().addClass('fahrenheit').setAttribute('type', 'number');
    const fahrenheitLabel = new Label().append('Fahrenheit ', fahrenheitInput);

    celsiusInput.on('input', () => {
      const c = Number(celsiusInput.getValue());
      this.celsius(c);
      this.fahrenheit(Math.round(c * 9 / 5 + 32));
    });

    fahrenheitInput.on('input', () => {
      const f = Number(fahrenheitInput.getValue());
      this.fahrenheit(f);
      this.celsius(Math.round((f - 32) * 5 / 9));
    });

    effect(() => {
      const c = this.celsius();
      if (c !== undefined && !celsiusInput.isFocused()) {
        celsiusInput.setValue(String(c));
      }
    });

    effect(() => {
      const f = this.fahrenheit();
      if (f !== undefined && !fahrenheitInput.isFocused()) {
        fahrenheitInput.setValue(String(f));
      }
    });

    root.append(celsiusLabel, arrow, fahrenheitLabel);
    return root;
  }
}

export default TempConverter;
