import { View } from '@matthewp/zebra';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export class TodoItem extends View {
  id = -1;
  text = '';
  done = false;

  checkboxNode!: HTMLInputElement;
  textNode!: HTMLSpanElement;
  deleteNode!: HTMLButtonElement;

  template(props?: Partial<Todo>) {
    let done = props?.done ?? false;
    return `<li class="todo-item${done ? ' completed' : ''}">
      <input class="todo-checkbox" type="checkbox"${done ? ' checked' : ''}>
      <span class="todo-item-text">${props?.text ?? ''}</span>
      <button class="todo-delete" type="button">&times;</button>
    </li>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.checkboxNode = el.querySelector('.todo-checkbox') as HTMLInputElement;
    this.textNode = el.querySelector('.todo-item-text') as HTMLSpanElement;
    this.deleteNode = el.querySelector('.todo-delete') as HTMLButtonElement;

    this.checkboxNode.addEventListener('change', () => this.onToggle());
    this.deleteNode.addEventListener('click', () => this.onDelete());
  }

  setId(value: number) {
    if (this.id !== value) {
      this.id = value;
    }
  }

  setText(value: string) {
    if (this.text !== value) {
      this.text = value;
      this.textNode.textContent = value;
    }
  }

  setDone(value: boolean) {
    if (this.done !== value) {
      this.done = value;
      this.checkboxNode.checked = value;
      this.el.classList.toggle('completed', value);
    }
  }

  onToggle() {
    this.el.dispatchEvent(new CustomEvent('todo-toggle', {
      detail: { id: this.id },
      bubbles: true,
    }));
  }

  onDelete() {
    this.el.dispatchEvent(new CustomEvent('delete', {
      detail: { id: this.id },
      bubbles: true,
    }));
  }

  update(data: Partial<Todo> = {}) {
    if ('id' in data) this.setId(data.id!);
    if ('text' in data) this.setText(data.text!);
    if ('done' in data) this.setDone(data.done!);
    return this.el;
  }
}

export default TodoItem;
