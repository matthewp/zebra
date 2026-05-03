import { View, Div, Span, Button, signal, effect } from '@matthewp/zebra';
import { defineComponent } from '@matthewp/zebra-astro';

class Counter extends View {
  count: ReturnType<typeof signal<number>>;
  props: { initial: number };

  constructor(props: { initial: number }) {
    super();
    this.props = props;
    this.count = signal(props.initial);
  }

  render() {
    const root = new Div().addClass('counter');
    const label = new Span();
    const inc = new Button()
      .setText('+')
      .on('click', () => this.count(this.count() + 1));

    effect(() => label.setText(String(this.count())));

    root.append(label, ' ', inc);
    return root;
  }
}

export default defineComponent(Counter);
