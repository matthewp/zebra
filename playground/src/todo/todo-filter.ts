import { View } from '@matthewp/zebra';

export type FilterMode = 'all' | 'active' | 'completed';

export class TodoFilter extends View {
  mode: FilterMode = 'all';

  allNode!: HTMLButtonElement;
  activeNode!: HTMLButtonElement;
  completedNode!: HTMLButtonElement;

  template() {
    return `<div class="todo-filter">
      <button class="filter-all active" type="button">All</button>
      <button class="filter-active" type="button">Active</button>
      <button class="filter-completed" type="button">Completed</button>
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.allNode = el.querySelector('.filter-all') as HTMLButtonElement;
    this.activeNode = el.querySelector('.filter-active') as HTMLButtonElement;
    this.completedNode = el.querySelector('.filter-completed') as HTMLButtonElement;

    this.allNode.addEventListener('click', () => this.onFilterClick('all'));
    this.activeNode.addEventListener('click', () => this.onFilterClick('active'));
    this.completedNode.addEventListener('click', () => this.onFilterClick('completed'));
  }

  setMode(value: FilterMode) {
    if (this.mode !== value) {
      this.mode = value;
      this.allNode.classList.toggle('active', value === 'all');
      this.activeNode.classList.toggle('active', value === 'active');
      this.completedNode.classList.toggle('active', value === 'completed');
    }
  }

  onFilterClick(mode: FilterMode) {
    this.setMode(mode);
    this.el.dispatchEvent(new CustomEvent('filter-change', {
      detail: { mode },
      bubbles: true,
    }));
  }

  update(data: { mode?: FilterMode } = {}) {
    if ('mode' in data) this.setMode(data.mode!);
    return this.el;
  }
}

export default TodoFilter;
