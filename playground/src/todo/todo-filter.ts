import { View, Div, Button, signal, effect, type Element } from '@matthewp/zebra';

export type FilterMode = 'all' | 'active' | 'completed';

export class TodoFilter extends View {
  mode: ReturnType<typeof signal<FilterMode>>;

  constructor(mode: ReturnType<typeof signal<FilterMode>>) {
    super();
    this.mode = mode;
  }

  render(): Element {
    const root = new Div().addClass('todo-filter');
    const all = new Button().addClass('filter-all').setAttribute('type', 'button').setText('All');
    const active = new Button().addClass('filter-active').setAttribute('type', 'button').setText('Active');
    const completed = new Button().addClass('filter-completed').setAttribute('type', 'button').setText('Completed');

    all.on('click', () => this.mode('all'));
    active.on('click', () => this.mode('active'));
    completed.on('click', () => this.mode('completed'));

    effect(() => {
      const m = this.mode();
      all.toggleClass('active', m === 'all');
      active.toggleClass('active', m === 'active');
      completed.toggleClass('active', m === 'completed');
    });

    root.append(all, active, completed);
    return root;
  }
}

export default TodoFilter;
