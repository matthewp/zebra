import { View, Div, DocumentElement, type Element } from '@matthewp/zebra';
import { Counter } from './counter.ts';
import { FullName } from './full-name.ts';
import { TempConverter } from './temp-converter.ts';
import { SearchFilter } from './search-filter.ts';
import { TodoApp } from './todo/todo-app.ts';
import { Weather } from './weather/weather.ts';
import { Clock } from './clock/clock.ts';
import { KanbanBoard } from './kanban/kanban.ts';
import { Tabs } from './tabs.ts';

export class App extends View {
  tabs = new Tabs([
    { label: 'Todos', view: new TodoApp() },
    { label: 'Counter', view: new Counter() },
    { label: 'Full Name', view: new FullName() },
    { label: 'Temp Converter', view: new TempConverter() },
    { label: 'Search Filter', view: new SearchFilter() },
    { label: 'Weather', view: new Weather() },
    { label: 'Clock', view: new Clock() },
    { label: 'Kanban', view: new KanbanBoard() },
  ]);

  render(): Element {
    new DocumentElement().setAttribute('data-app', 'zebra-playground');

    const root = new Div().addClass('app');
    root.append(this.tabs);
    return root;
  }
}

export default App;
