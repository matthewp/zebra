import { View, slot } from '@matthewp/zebra';
import { List } from '@matthewp/zebra/list';
import { TodoItem, type Todo } from './todo-item.ts';

export class TodoList extends View {
  list: List<Todo>;

  constructor() {
    super();
    this.list = new List(TodoItem, (todo: Todo) => todo.id);
  }

  template(props?: { todos?: Todo[] }) {
    return `<ul class="todo-list">${slot(this.list, props?.todos)}</ul>`;
  }

  mount(el: HTMLElement, todos?: Todo[]) {
    super.mount(el);
    this.list.mount(el, todos);
  }

  setTodos(todos: Todo[]) {
    this.list.update(todos);
  }

  update(data: { todos?: Todo[] } = {}) {
    if ('todos' in data) this.setTodos(data.todos!);
    return this.el;
  }
}

export default TodoList;
