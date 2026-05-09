import { View, Li, Input, Span, Button, signal, type Element } from '@matthewp/zebra';

export interface Todo {
  id: number;
  text: ReturnType<typeof signal<string>>;
  done: ReturnType<typeof signal<boolean>>;
}

export class TodoItem extends View {
  private todo: Todo;

  constructor(todo: Todo) {
    super();
    this.todo = todo;
  }

  render(): Element {
    const root = new Li()
      .addClass('todo-item')
      .toggleClass('completed', this.todo.done);

    const checkbox = new Input()
      .addClass('todo-checkbox')
      .setAttribute('type', 'checkbox')
      .setChecked(this.todo.done)
      .on('change', () => this.onToggle());

    const text = new Span()
      .addClass('todo-item-text')
      .setText(this.todo.text);

    const del = new Button()
      .addClass('todo-delete')
      .setAttribute('type', 'button')
      .setText('×')
      .on('click', () => this.onDelete());

    root.append(checkbox, text, del);
    return root;
  }

  onToggle() {
    this.emit('todo-toggle', { id: this.todo.id });
  }

  onDelete() {
    this.emit('delete', { id: this.todo.id });
  }
}

export default TodoItem;
