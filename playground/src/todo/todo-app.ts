import { View, Div, H2, List, signal, computed, type Element } from '@matthewp/zebra';
import { TodoInput } from './todo-input.ts';
import { TodoFilter, type FilterMode } from './todo-filter.ts';
import { TodoItem, type Todo } from './todo-item.ts';

const makeTodo = (id: number, text: string, done: boolean): Todo => ({
  id,
  text: signal(text),
  done: signal(done),
});

export class TodoApp extends View {
  todos = signal<Todo[]>([
    makeTodo(1, 'Learn Zebra', false),
    makeTodo(2, 'Build something cool', false),
    makeTodo(3, 'Design the SSR story', true),
  ]);
  filter = signal<FilterMode>('all');
  nextId = 4;

  filteredTodos = computed(() => {
    const f = this.filter();
    const t = this.todos();
    if (f === 'active') return t.filter(t => !t.done());
    if (f === 'completed') return t.filter(t => t.done());
    return t;
  });

  todoInput = new TodoInput();
  todoList = new List<Todo>(
    this.filteredTodos,
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
    this.todos([...this.todos(), makeTodo(this.nextId++, e.detail.text, false)]);
  }

  onToggle(e: CustomEvent) {
    const t = this.todos().find(t => t.id === e.detail.id);
    if (t) t.done(!t.done());
  }

  onDelete(e: CustomEvent) {
    this.todos(this.todos().filter(t => t.id !== e.detail.id));
  }
}

export default TodoApp;
