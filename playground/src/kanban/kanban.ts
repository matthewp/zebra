import { View, Div, signal, type Element } from '@matthewp/zebra';
import { ColumnView, type Column } from './column.ts';
import { CardView, type Card } from './card.ts';
import { trackDrag } from './dnd.ts';

interface DragState {
  cardId: number;
  card: Card;
  fromColumnId: string;
  fromIndex: number;
  ghost: HTMLElement;
  offsetX: number;
  offsetY: number;
}

export class KanbanBoard extends View {
  private nextId = 1;
  private columns: ColumnView[];
  private columnsById: Map<string, ColumnView>;
  private draggedCardId = signal<number | null>(null);
  private dragState: DragState | null = null;

  constructor() {
    super();
    const initial: Column[] = [
      { id: 'todo', title: 'To Do', cards: [
        { id: this.nextId++, text: 'Design the kanban demo' },
        { id: this.nextId++, text: 'Pick a color palette' },
        { id: this.nextId++, text: 'Write the readme' },
      ]},
      { id: 'doing', title: 'In Progress', cards: [
        { id: this.nextId++, text: 'Build pointer-based DnD' },
        { id: this.nextId++, text: 'Sketch column layout' },
      ]},
      { id: 'done', title: 'Done', cards: [
        { id: this.nextId++, text: 'Brainstorm with the team' },
      ]},
    ];
    this.columns = initial.map(c => new ColumnView(c, this.draggedCardId));
    this.columnsById = new Map(this.columns.map(c => [c.column.id, c]));
  }

  render(): Element {
    const root = new Div().addClass('kanban-board');
    for (const col of this.columns) root.append(col);

    root.on('card-add', e => this.onCardAdd(e as CustomEvent));
    root.on('card-edit', e => this.onCardEdit(e as CustomEvent));
    root.on('card-remove', e => this.onCardRemove(e as CustomEvent));
    root.on('card-grab', e => this.onCardGrab(e as CustomEvent));

    return root;
  }

  private onCardAdd(e: CustomEvent) {
    const { columnId, text } = e.detail as { columnId: string; text: string };
    const col = this.columnsById.get(columnId);
    if (!col) return;
    col.setCards([...col.getCards(), { id: this.nextId++, text }]);
  }

  private onCardEdit(e: CustomEvent) {
    const { id, text } = e.detail as { id: number; text: string };
    const loc = this.findCard(id);
    if (!loc) return;
    const col = this.columnsById.get(loc.columnId)!;
    const cards = col.getCards().slice();
    cards[loc.index] = { ...cards[loc.index], text };
    col.setCards(cards);
  }

  private onCardRemove(e: CustomEvent) {
    const { id } = e.detail as { id: number };
    const loc = this.findCard(id);
    if (!loc) return;
    const col = this.columnsById.get(loc.columnId)!;
    col.setCards(col.getCards().filter(c => c.id !== id));
  }

  private onCardGrab(e: CustomEvent) {
    const { id, view, startX, startY } = e.detail as {
      id: number; view: CardView; startX: number; startY: number;
    };
    const loc = this.findCard(id);
    if (!loc) return;
    const col = this.columnsById.get(loc.columnId)!;
    const card = col.getCards()[loc.index];
    this.startDrag(loc.columnId, loc.index, card, view, startX, startY);
  }

  private startDrag(
    fromColumnId: string,
    fromIndex: number,
    card: Card,
    sourceView: CardView,
    startX: number,
    startY: number,
  ) {
    const rect = sourceView.measure(el => el.getBoundingClientRect());
    if (!rect) return;

    trackDrag(startX, startY, {
      onPickup: (x, y) => {
        const ghost = sourceView.measure(el => el.cloneNode(true) as HTMLElement);
        if (!ghost) return;
        ghost.classList.add('kanban-ghost');
        ghost.classList.remove('dragging');
        ghost.style.position = 'fixed';
        ghost.style.left = '0';
        ghost.style.top = '0';
        ghost.style.width = `${rect.width}px`;
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '1000';
        document.body.appendChild(ghost);

        this.dragState = {
          cardId: card.id,
          card,
          fromColumnId,
          fromIndex,
          ghost,
          offsetX: x - rect.left,
          offsetY: y - rect.top,
        };
        this.draggedCardId(card.id);
        document.body.classList.add('kanban-dragging');
        this.updateGhost(x, y);
      },
      onMove: (x, y) => {
        if (!this.dragState) return;
        this.updateGhost(x, y);
        this.computeAndApplyDropTarget(x, y);
      },
      onDrop: (_x, _y, cancelled) => {
        if (!this.dragState) return;
        this.dragState.ghost.remove();
        document.body.classList.remove('kanban-dragging');
        if (cancelled) {
          const curr = this.findCard(this.dragState.cardId);
          if (curr) this.removeAt(curr.columnId, curr.index);
          this.insertAt(
            this.dragState.fromColumnId,
            this.dragState.fromIndex,
            this.dragState.card,
          );
        }
        this.draggedCardId(null);
        this.dragState = null;
      },
    });
  }

  private updateGhost(x: number, y: number) {
    if (!this.dragState) return;
    const { ghost, offsetX, offsetY } = this.dragState;
    ghost.style.transform = `translate(${x - offsetX}px, ${y - offsetY}px)`;
  }

  private computeAndApplyDropTarget(x: number, y: number) {
    if (!this.dragState) return;

    const targetCol = this.findColumnAt(x, y);
    if (!targetCol) return;

    const cards = targetCol.getCards();
    const draggedId = this.dragState.cardId;
    const targetIndex = targetCol.getCardsList().measure(containerEl => {
      const cardEls = containerEl.children;
      for (let i = 0; i < cardEls.length; i++) {
        if (cards[i] && cards[i].id === draggedId) continue;
        const r = (cardEls[i] as HTMLElement).getBoundingClientRect();
        if (y < r.top + r.height / 2) return i;
      }
      return cardEls.length;
    });
    if (targetIndex === undefined) return;

    const curr = this.findCard(draggedId);
    if (!curr) return;
    if (curr.columnId === targetCol.column.id) {
      const adjusted = targetIndex > curr.index ? targetIndex - 1 : targetIndex;
      if (adjusted === curr.index) return;
      this.moveWithin(curr.columnId, curr.index, adjusted);
    } else {
      this.moveAcross(curr.columnId, curr.index, targetCol.column.id, targetIndex);
    }
  }

  private findColumnAt(x: number, y: number): ColumnView | null {
    for (const col of this.columns) {
      const hit = col.measure(el => {
        const r = el.getBoundingClientRect();
        return x >= r.left && x < r.right && y >= r.top && y < r.bottom;
      });
      if (hit) return col;
    }
    return null;
  }

  private findCard(id: number): { columnId: string; index: number } | null {
    for (const col of this.columns) {
      const cards = col.getCards();
      const i = cards.findIndex(c => c.id === id);
      if (i >= 0) return { columnId: col.column.id, index: i };
    }
    return null;
  }

  private moveWithin(colId: string, fromIdx: number, toIdx: number) {
    const col = this.columnsById.get(colId)!;
    const cards = col.getCards().slice();
    const [card] = cards.splice(fromIdx, 1);
    cards.splice(toIdx, 0, card);
    col.setCards(cards);
  }

  private moveAcross(fromCol: string, fromIdx: number, toCol: string, toIdx: number) {
    const src = this.columnsById.get(fromCol)!;
    const dst = this.columnsById.get(toCol)!;
    const srcCards = src.getCards().slice();
    const [card] = srcCards.splice(fromIdx, 1);
    src.setCards(srcCards);
    const dstCards = dst.getCards().slice();
    dstCards.splice(toIdx, 0, card);
    dst.setCards(dstCards);
  }

  private removeAt(colId: string, idx: number) {
    const col = this.columnsById.get(colId)!;
    const cards = col.getCards().slice();
    cards.splice(idx, 1);
    col.setCards(cards);
  }

  private insertAt(colId: string, idx: number, card: Card) {
    const col = this.columnsById.get(colId)!;
    const cards = col.getCards().slice();
    cards.splice(idx, 0, card);
    col.setCards(cards);
  }
}

export default KanbanBoard;
