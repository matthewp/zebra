import { View } from '@matthewp/zebra';

export class TodoInput extends View {
  inputNode!: HTMLInputElement;

  template() {
    return `<form class="todo-input">
      <input class="todo-text" type="text" placeholder="What needs to be done?">
      <button type="submit">Add</button>
    </form>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.inputNode = el.querySelector('.todo-text') as HTMLInputElement;

    el.addEventListener('submit', (e) => this.onSubmit(e));
  }

  onSubmit(e: Event) {
    e.preventDefault();
    let text = this.inputNode.value.trim();
    if (text) {
      this.el.dispatchEvent(new CustomEvent('add', {
        detail: { text },
        bubbles: true,
      }));
      this.inputNode.value = '';
    }
  }

  update() {
    return this.el;
  }
}

export default TodoInput;
