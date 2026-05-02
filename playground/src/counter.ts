import { View, Div, Span, Button, signal, effect, type Element } from '@matthewp/zebra';

export class Counter extends View {
  count = signal(0);
  min = 0;

  render(): Element {
    const root = new Div().addClass('counter');
    const decrement = new Button().addClass('decrement').setText('-')
      .on('click', () => this.onDecrementClick());
    const span = new Span().addClass('count');
    const increment = new Button().addClass('increment').setText('+')
      .on('click', () => this.onIncrementClick());

    root.append(decrement, span, increment);

    effect(() => {
      span.setText(String(this.count()));
    });

    return root;
  }

  onIncrementClick() {
    this.count(this.count() + 1);
  }

  onDecrementClick() {
    if (this.count() - 1 >= this.min) {
      this.count(this.count() - 1);
    }
  }
}
