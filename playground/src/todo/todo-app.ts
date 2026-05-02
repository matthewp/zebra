import { View, Div, H2, signal, computed, type Element } from '@matthewp/zebra';
import { List } from '@matthewp/zebra/list';
import { TodoInput } from './todo-input.ts';
import { TodoFilter, type FilterMode } from './todo-filter.ts';
import { TodoItem, type Todo } from './todo-item.ts';

export class TodoApp extends View {
  todos = signal<Todo[]>([
    { id: 1, text: 'Learn Zebra', done: false },
    { id: 2, text: 'Build something cool', done: false },
    { id: 3, text: 'Design the SSR story', done: true },
  ]);
  filter = signal<FilterMode>('all');
  nextId = 4;

  filteredTodos = computed(() => {
    const f = this.filter();
    const t = this.todos();
    if (f === 'active') return t.filter(t => !t.done);
    if (f === 'completed') return t.filter(t => t.done);
    return t;
  });

  todoInput = new TodoInput();
  todoList = new List<Todo>(
    () => this.filteredTodos(),
    todo => todo.id,
    todo => new TodoItem(todo),
    'ul',
  ).addClass('todo-list');
  todoFilter = new TodoFilter(this.filter);

  render(): Element {
    const root = new Div().addClass('todo-app');
    root.append(
      new H2().setText('Todos'),
      this.todoInput,
      this.todoList,
      this.todoFilter,
    );

    root.on('add', (e) => this.onAdd(e as CustomEvent));
    root.on('todo-toggle', (e) => this.onToggle(e as CustomEvent));
    root.on('delete', (e) => this.onDelete(e as CustomEvent));

    return root;
  }

  onAdd(e: CustomEvent) {
    this.todos([
      ...this.todos(),
      { id: this.nextId++, text: e.detail.text, done: false },
    ]);
  }

  onToggle(e: CustomEvent) {
    this.todos(this.todos().map(t =>
      t.id === e.detail.id ? { ...t, done: !t.done } : t
    ));
  }

  onDelete(e: CustomEvent) {
    this.todos(this.todos().filter(t => t.id !== e.detail.id));
  }
}

export default TodoApp;
