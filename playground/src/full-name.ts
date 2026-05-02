import { View, Div, Label, Input, Output, signal, effect, type Element } from '@matthewp/zebra';

export class FullName extends View {
  first = signal('');
  last = signal('');

  render(): Element {
    const root = new Div().addClass('full-name');

    const firstInput = new Input().addClass('first').setAttribute('type', 'text');
    const firstLabel = new Label().append('First ', firstInput);

    const lastInput = new Input().addClass('last').setAttribute('type', 'text');
    const lastLabel = new Label().append('Last ', lastInput);

    const output = new Output().addClass('output');

    firstInput.on('input', () => this.first(firstInput.getValue()));
    lastInput.on('input', () => this.last(lastInput.getValue()));

    effect(() => {
      output.setText(`${this.first()} ${this.last()}`.trim());
    });

    root.append(firstLabel, lastLabel, output);
    return root;
  }
}

export default FullName;
