import { View, slot } from '@matthewp/zebra';
import { TodoInput } from './todo-input.ts';
import { TodoList } from './todo-list.ts';
import { TodoFilter, type FilterMode } from './todo-filter.ts';
import type { Todo } from './todo-item.ts';

export class TodoApp extends View {
  todos: Todo[] = [
    { id: 1, text: 'Learn Zebra', done: false },
    { id: 2, text: 'Build something cool', done: false },
    { id: 3, text: 'Design the SSR story', done: true },
  ];
  filter: FilterMode = 'all';
  nextId = 4;

  todoInput: TodoInput;
  todoList: TodoList;
  todoFilter: TodoFilter;

  constructor() {
    super();
    this.todoInput = new TodoInput();
    this.todoList = new TodoList();
    this.todoFilter = new TodoFilter();
  }

  template() {
    return `<div class="todo-app">
      <h2>Todos</h2>
      ${slot(this.todoInput)}
      ${slot(this.todoList, { todos: this.todos })}
      ${slot(this.todoFilter)}
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.todoInput.mount(el.querySelector('.todo-input') as HTMLElement);
    this.todoList.mount(el.querySelector('.todo-list') as HTMLElement, this.todos);
    this.todoFilter.mount(el.querySelector('.todo-filter') as HTMLElement);

    el.addEventListener('add', (e) => this.onAdd(e as CustomEvent));
    el.addEventListener('todo-toggle', (e) => this.onToggle(e as CustomEvent));
    el.addEventListener('delete', (e) => this.onDelete(e as CustomEvent));
    el.addEventListener('filter-change', (e) => this.onFilterChange(e as CustomEvent));
  }

  filteredTodos(): Todo[] {
    if (this.filter === 'active') return this.todos.filter(t => !t.done);
    if (this.filter === 'completed') return this.todos.filter(t => t.done);
    return this.todos;
  }

  renderList() {
    this.todoList.update({ todos: this.filteredTodos() });
  }

  onAdd(e: CustomEvent) {
    this.todos.push({ id: this.nextId++, text: e.detail.text, done: false });
    this.renderList();
  }

  onToggle(e: CustomEvent) {
    let todo = this.todos.find(t => t.id === e.detail.id);
    if (todo) {
      todo.done = !todo.done;
      this.renderList();
    }
  }

  onDelete(e: CustomEvent) {
    this.todos = this.todos.filter(t => t.id !== e.detail.id);
    this.renderList();
  }

  onFilterChange(e: CustomEvent) {
    this.filter = e.detail.mode;
    this.renderList();
  }

  update() {
    return this.el;
  }
}

export default TodoApp;
