import { View, Div, H3, Input, Button, List, signal, type Element } from '@matthewp/zebra';
import { CardView, type Card } from './card.ts';

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

type IdSignal = ReturnType<typeof signal<number | null>>;

export class ColumnView extends View {
  column: Column;
  private cards: ReturnType<typeof signal<Card[]>>;
  private draggedCardId: IdSignal;
  private cardsList: List<Card> | null = null;

  constructor(column: Column, draggedCardId: IdSignal) {
    super();
    this.column = column;
    this.cards = signal(column.cards);
    this.draggedCardId = draggedCardId;
  }

  render(): Element {
    const root = new Div().addClass('kanban-column');

    const header = new H3()
      .addClass('kanban-column-title')
      .setText(this.column.title);

    const list = new List<Card>(
      this.cards,
      card => card.id,
      card => new CardView(card, this.draggedCardId),
      'div',
    ).addClass('kanban-column-cards');
    this.cardsList = list;

    const composer = new Div().addClass('kanban-composer');
    const input = new Input()
      .addClass('kanban-composer-input')
      .setAttribute('type', 'text')
      .setAttribute('placeholder', 'Add a card…');
    const add = new Button()
      .addClass('kanban-composer-add')
      .setAttribute('type', 'button')
      .setText('+');

    const submit = () => {
      const text = input.getValue().trim();
      if (!text) return;
      input.setValue('');
      this.emit('card-add', { columnId: this.column.id, text });
    };

    add.on('click', submit);
    input.on('keydown', e => {
      if ((e as KeyboardEvent).key === 'Enter') submit();
    });

    composer.append(input, add);
    root.append(header, list, composer);
    return root;
  }

  getCards(): Card[] {
    return this.cards();
  }

  setCards(cards: Card[]) {
    this.cards(cards);
  }

  getCardsList(): List<Card> {
    return this.cardsList!;
  }
}
