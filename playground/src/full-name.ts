import { View } from '@matthewp/zebra';

export class FullName extends View {
  first = '';
  last = '';

  firstNode!: HTMLInputElement;
  lastNode!: HTMLInputElement;
  outputNode!: HTMLOutputElement;

  template() {
    return `<div class="full-name">
      <label>First <input class="first" type="text"></label>
      <label>Last <input class="last" type="text"></label>
      <output class="output"></output>
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.firstNode = el.querySelector('.first') as HTMLInputElement;
    this.lastNode = el.querySelector('.last') as HTMLInputElement;
    this.outputNode = el.querySelector('.output') as HTMLOutputElement;

    this.firstNode.addEventListener('input', () => this.onFirstInput());
    this.lastNode.addEventListener('input', () => this.onLastInput());
  }

  setFirst(value: string) {
    if (this.first !== value) {
      this.first = value;
      this.updateOutput();
    }
  }

  setLast(value: string) {
    if (this.last !== value) {
      this.last = value;
      this.updateOutput();
    }
  }

  updateOutput() {
    this.outputNode.textContent = `${this.first} ${this.last}`.trim();
  }

  onFirstInput() {
    this.setFirst(this.firstNode.value);
  }

  onLastInput() {
    this.setLast(this.lastNode.value);
  }

  update(data: { first?: string; last?: string } = {}) {
    if ('first' in data) this.setFirst(data.first!);
    if ('last' in data) this.setLast(data.last!);
    return this.el;
  }
}

export default FullName;
