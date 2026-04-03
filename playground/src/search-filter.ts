import { View } from '@matthewp/zebra';

const items = [
  'Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry',
  'Coconut', 'Date', 'Elderberry', 'Fig', 'Grape',
  'Guava', 'Honeydew', 'Kiwi', 'Lemon', 'Lime',
  'Mango', 'Melon', 'Nectarine', 'Orange', 'Papaya',
  'Peach', 'Pear', 'Quince',
];

export class SearchFilter extends View {
  query = '';

  searchNode!: HTMLInputElement;
  listNode!: HTMLElement;
  itemNodes: HTMLLIElement[] = [];

  template() {
    return `<div class="search-filter">
      <input class="search" type="text" placeholder="Filter fruits...">
      <ul class="list">
        ${items.map(item => `<li class="item">${item}</li>`).join('\n        ')}
      </ul>
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.searchNode = el.querySelector('.search') as HTMLInputElement;
    this.listNode = el.querySelector('.list') as HTMLElement;
    this.itemNodes = Array.from(this.listNode.querySelectorAll('.item')) as HTMLLIElement[];

    this.searchNode.addEventListener('input', () => this.onSearchInput());
  }

  setQuery(value: string) {
    if (this.query !== value) {
      this.query = value;
      let lower = value.toLowerCase();
      for (let node of this.itemNodes) {
        let match = !lower || node.textContent!.toLowerCase().includes(lower);
        node.style.display = match ? '' : 'none';
      }
    }
  }

  onSearchInput() {
    this.setQuery(this.searchNode.value);
  }

  update(data: { query?: string } = {}) {
    if ('query' in data) this.setQuery(data.query!);
    return this.el;
  }
}

export default SearchFilter;
