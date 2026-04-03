import { View } from '@matthewp/zebra';

export class Counter extends View {
  count: number | undefined = undefined;
  min = 0;

  countNode!: HTMLSpanElement;
  incrementNode!: HTMLButtonElement;
  decrementNode!: HTMLButtonElement;

  template() {
    return `<div class="counter">
      <button class="decrement">-</button>
      <span class="count">0</span>
      <button class="increment">+</button>
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.countNode = el.querySelector('.count') as HTMLSpanElement;
    this.incrementNode = el.querySelector('.increment') as HTMLButtonElement;
    this.decrementNode = el.querySelector('.decrement') as HTMLButtonElement;

    this.incrementNode.addEventListener('click', () => this.onIncrementClick());
    this.decrementNode.addEventListener('click', () => this.onDecrementClick());

    this.setCount(0);
  }

  setCount(value: number) {
    if (this.count !== value) {
      this.count = value;
      this.countNode.textContent = String(value);
    }
  }

  onIncrementClick() {
    this.setCount(this.count! + 1);
  }

  onDecrementClick() {
    if (this.count! - 1 >= this.min) {
      this.setCount(this.count! - 1);
    }
  }

  update(data: { count?: number } = {}) {
    if ('count' in data) this.setCount(data.count!);
    return this.el;
  }
}
