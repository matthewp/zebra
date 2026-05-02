import { View, Div, Input, Ul, Li, signal, effect, type Element } from '@matthewp/zebra';

const items = [
  'Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry',
  'Coconut', 'Date', 'Elderberry', 'Fig', 'Grape',
  'Guava', 'Honeydew', 'Kiwi', 'Lemon', 'Lime',
  'Mango', 'Melon', 'Nectarine', 'Orange', 'Papaya',
  'Peach', 'Pear', 'Quince',
];

export class SearchFilter extends View {
  query = signal('');

  render(): Element {
    const root = new Div().addClass('search-filter');

    const search = new Input()
      .addClass('search')
      .setAttribute('type', 'text')
      .setAttribute('placeholder', 'Filter fruits...');

    const list = new Ul().addClass('list');

    const itemEls = items.map(name => {
      const li = new Li().addClass('item').setText(name);
      list.append(li);
      return li;
    });

    search.on('input', () => {
      this.query(search.getValue());
    });

    effect(() => {
      const lower = this.query().toLowerCase();
      for (let i = 0; i < items.length; i++) {
        const match = !lower || items[i].toLowerCase().includes(lower);
        if (match) itemEls[i].show();
        else itemEls[i].hide();
      }
    });

    root.append(search, list);
    return root;
  }
}

export default SearchFilter;
