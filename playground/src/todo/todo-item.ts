import { View, Li, Input, Span, Button, signal, effect, type Element } from '@matthewp/zebra';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export class TodoItem extends View {
  todo: ReturnType<typeof signal<Todo>>;

  constructor(initialTodo: Todo) {
    super();
    this.todo = signal(initialTodo);
  }

  render(): Element {
    const root = new Li().addClass('todo-item');
    const checkbox = new Input().addClass('todo-checkbox').setAttribute('type', 'checkbox');
    const text = new Span().addClass('todo-item-text');
    const del = new Button()
      .addClass('todo-delete')
      .setAttribute('type', 'button')
      .setText('×')
      .on('click', () => this.onDelete());

    checkbox.on('change', () => this.onToggle());

    effect(() => {
      const t = this.todo();
      text.setText(t.text);
      checkbox.setChecked(t.done);
      root.toggleClass('completed', t.done);
    });

    root.append(checkbox, text, del);
    return root;
  }

  update(todo: Todo) {
    this.todo(todo);
  }

  onToggle() {
    this.emit('todo-toggle', { id: this.todo().id });
  }

  onDelete() {
    this.emit('delete', { id: this.todo().id });
  }
}

export default TodoItem;
