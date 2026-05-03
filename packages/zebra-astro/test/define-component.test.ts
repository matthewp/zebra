import { View, Div } from '@matthewp/zebra';
import { defineComponent } from '../src/component.ts';

class Greeting extends View {
  props: { name: string };
  constructor(props: { name: string }) {
    super();
    this.props = props;
  }
  render() {
    return new Div().setText(`Hello, ${this.props.name}`);
  }
}

const G = defineComponent(Greeting);

// Props are inferred from the View's constructor — no explicit type argument needed.
G({ name: 'world' });

// @ts-expect-error - missing required prop
G({});

// @ts-expect-error - wrong prop type
G({ name: 123 });

// @ts-expect-error - extra unknown prop
G({ name: 'x', other: true });
