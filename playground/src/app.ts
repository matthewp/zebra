import { View, slot } from '@matthewp/zebra';
import { Counter } from './counter.ts';
import { FullName } from './full-name.ts';
import { TempConverter } from './temp-converter.ts';
import { SearchFilter } from './search-filter.ts';
import { TodoApp } from './todo/todo-app.ts';
import { Tabs } from './tabs.ts';

export class App extends View {
  tabs: Tabs;

  constructor() {
    super();
    this.tabs = new Tabs([
      { label: 'Todos', view: new TodoApp() },
      { label: 'Counter', view: new Counter() },
      { label: 'Full Name', view: new FullName() },
      { label: 'Temp Converter', view: new TempConverter() },
      { label: 'Search Filter', view: new SearchFilter() },
    ]);
  }

  template() {
    return `<div class="app">${slot(this.tabs)}</div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.tabs.mount(el.querySelector('.tabs') as HTMLElement);
  }

  update() {
    return this.el;
  }
}

export default App;
