import { View, Div, Span, Input, Button, signal, effect, type Element } from '@matthewp/zebra';

export interface Card {
  id: number;
  text: ReturnType<typeof signal<string>>;
}

type IdSignal = ReturnType<typeof signal<number | null>>;

export class CardView extends View {
  editing = signal(false);
  private draggedCardId: IdSignal;
  private card: Card;

  constructor(card: Card, draggedCardId: IdSignal) {
    super();
    this.card = card;
    this.draggedCardId = draggedCardId;
  }

  render(): Element {
    const root = new Div()
      .addClass('kanban-card')
      .toggleClass('dragging', () => this.draggedCardId() === this.card.id);

    const text = new Span()
      .addClass('kanban-card-text')
      .setText(this.card.text);

    const input = new Input()
      .addClass('kanban-card-edit')
      .setAttribute('type', 'text');

    const del = new Button()
      .addClass('kanban-card-delete')
      .setAttribute('type', 'button')
      .setAttribute('aria-label', 'Delete card')
      .setText('×')
      .on('pointerdown', e => e.stopPropagation())
      .on('click', e => {
        e.stopPropagation();
        this.emit('card-remove', { id: this.card.id });
      });

    effect(() => {
      const isEditing = this.editing();
      if (isEditing) {
        text.hide();
        input.show();
        input.setValue(this.card.text());
        queueMicrotask(() => {
          input.focus();
          if (input.el) (input.el as HTMLInputElement).select();
        });
      } else {
        text.show();
        input.hide();
      }
    });

    input
      .on('pointerdown', e => e.stopPropagation())
      .on('keydown', e => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter') {
          ke.preventDefault();
          this.commitEdit(input.getValue());
        } else if (ke.key === 'Escape') {
          this.editing(false);
        }
      })
      .on('blur', () => {
        if (this.editing()) this.commitEdit(input.getValue());
      });

    root
      .on('dblclick', () => this.startEdit())
      .on('pointerdown', e => this.onPointerDown(e as PointerEvent));

    input.hide();
    root.append(text, input, del);
    return root;
  }

  startEdit() {
    if (this.editing()) return;
    this.editing(true);
  }

  commitEdit(text: string) {
    this.editing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== this.card.text()) {
      this.emit('card-edit', { id: this.card.id, text: trimmed });
    }
  }

  onPointerDown(e: PointerEvent) {
    if (this.editing() || e.button !== 0) return;
    e.preventDefault();
    this.emit('card-grab', {
      id: this.card.id,
      view: this,
      startX: e.clientX,
      startY: e.clientY,
    });
  }
}
