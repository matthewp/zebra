import { Element } from './element.ts';
import { View } from './view.ts';
import { effect, signal } from 'alien-signals';

type ItemSource<T> = T[] | (() => T[]);
type IndexSignal = { (): number; (value: number): void };
type Factory<T> = (item: T, index: () => number) => View;

export class List<T = unknown> extends View {
  private _containerTag: string;
  private _items: ItemSource<T>;
  private _keyFn: (item: T) => unknown;
  private _factory: Factory<T>;
  private _views: (View | null)[] = [];
  private _keys: unknown[] = [];
  private _indexSignals: IndexSignal[] = [];
  private _currentItems: (T | null)[] = [];

  constructor(
    items: ItemSource<T>,
    keyFn: (item: T) => unknown,
    factory: Factory<T>,
    tag = 'div',
  ) {
    super();
    this._containerTag = tag;
    this._items = items;
    this._keyFn = keyFn;
    this._factory = factory;
  }

  private _getItems(): T[] {
    return typeof this._items === 'function'
      ? (this._items as () => T[])()
      : this._items;
  }

  private _create(item: T, index: number): { view: View; indexSignal: IndexSignal } {
    const indexSignal = signal(index) as IndexSignal;
    const view = this._factory(item, indexSignal as () => number);
    return { view, indexSignal };
  }

  render(): Element {
    const container = new Element(this._containerTag);

    effect(() => {
      const items = this._getItems();
      if (container.el) {
        this._reconcile(container.el, items);
      } else {
        this._buildInitial(container, items);
      }
    });

    return container;
  }

  private _buildInitial(container: Element, items: T[]): void {
    this._views = [];
    this._keys = [];
    this._indexSignals = [];
    this._currentItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const { view, indexSignal } = this._create(item, i);
      this._views.push(view);
      this._keys.push(this._keyFn(item));
      this._indexSignals.push(indexSignal);
      this._currentItems.push(item);
      container.append(view);
    }
  }

  private _reconcile(container: HTMLElement, items: T[]): void {
    const oldViews = this._views;
    const oldKeys = this._keys;
    const oldIndexSignals = this._indexSignals;
    const oldItems = this._currentItems;

    // Fast path: same length + all keys in same order
    if (items.length === oldViews.length && items.length > 0) {
      let sameOrder = true;
      const checkKeys = new Array(items.length);
      for (let i = 0; i < items.length; i++) {
        checkKeys[i] = this._keyFn(items[i]);
        if (checkKeys[i] !== oldKeys[i]) { sameOrder = false; break; }
      }
      if (sameOrder) {
        for (let i = 0; i < items.length; i++) {
          if (items[i] !== oldItems[i]) {
            // ref changed → recreate at this slot
            const { view, indexSignal } = this._create(items[i], i);
            oldViews[i]!.toDOM().replaceWith(view.toDOM());
            this._views[i] = view;
            this._indexSignals[i] = indexSignal;
            this._currentItems[i] = items[i];
          }
        }
        return;
      }
    }

    const newKeys = items.map(this._keyFn);
    const newViews: (View | null)[] = new Array(items.length).fill(null);
    const newItems: (T | null)[] = new Array(items.length).fill(null);
    const newIndexSignals: (IndexSignal | null)[] = new Array(items.length).fill(null);

    // Reuse the view at oldPos for newPos when refs match; otherwise recreate.
    // For "in place" branches (head/head, tail/tail) the DOM stays where it is on reuse,
    // and is replaced via replaceWith on recreate.
    const inPlace = (newPos: number, oldPos: number) => {
      if (items[newPos] === oldItems[oldPos]) {
        newViews[newPos] = oldViews[oldPos];
        newIndexSignals[newPos] = oldIndexSignals[oldPos];
      } else {
        const { view, indexSignal } = this._create(items[newPos], newPos);
        oldViews[oldPos]!.toDOM().replaceWith(view.toDOM());
        newViews[newPos] = view;
        newIndexSignals[newPos] = indexSignal;
      }
      newItems[newPos] = items[newPos];
    };

    // For branches that move DOM (diagonals, key-map fallback). Returns the DOM
    // node to insert at the destination — caller positions it.
    const move = (newPos: number, oldPos: number): Node => {
      let dom: Node;
      if (items[newPos] === oldItems[oldPos]) {
        newViews[newPos] = oldViews[oldPos];
        newIndexSignals[newPos] = oldIndexSignals[oldPos];
        dom = oldViews[oldPos]!.toDOM();
      } else {
        oldViews[oldPos]!.toDOM().remove();
        const { view, indexSignal } = this._create(items[newPos], newPos);
        newViews[newPos] = view;
        newIndexSignals[newPos] = indexSignal;
        dom = view.toDOM();
      }
      newItems[newPos] = items[newPos];
      return dom;
    };

    let oldHead = 0;
    let oldTail = oldViews.length - 1;
    let newHead = 0;
    let newTail = items.length - 1;

    let oldKeyToIndex: Map<unknown, number> | undefined;

    while (oldHead <= oldTail && newHead <= newTail) {
      if (oldViews[oldHead] === null) {
        oldHead++;
      } else if (oldViews[oldTail] === null) {
        oldTail--;
      } else if (oldKeys[oldHead] === newKeys[newHead]) {
        inPlace(newHead, oldHead);
        oldHead++;
        newHead++;
      } else if (oldKeys[oldTail] === newKeys[newTail]) {
        inPlace(newTail, oldTail);
        oldTail--;
        newTail--;
      } else if (oldKeys[oldHead] === newKeys[newTail]) {
        const dom = move(newTail, oldHead);
        oldViews[oldTail]!.toDOM().after(dom);
        oldHead++;
        newTail--;
      } else if (oldKeys[oldTail] === newKeys[newHead]) {
        const dom = move(newHead, oldTail);
        oldViews[oldHead]!.toDOM().before(dom);
        oldTail--;
        newHead++;
      } else {
        if (!oldKeyToIndex) {
          oldKeyToIndex = new Map();
          for (let i = oldHead; i <= oldTail; i++) {
            if (oldViews[i] !== null) {
              oldKeyToIndex.set(oldKeys[i], i);
            }
          }
        }

        const oldIndex = oldKeyToIndex.get(newKeys[newHead]);
        if (oldIndex === undefined) {
          const { view, indexSignal } = this._create(items[newHead], newHead);
          newViews[newHead] = view;
          newItems[newHead] = items[newHead];
          newIndexSignals[newHead] = indexSignal;
          oldViews[oldHead]!.toDOM().before(view.toDOM());
        } else {
          const dom = move(newHead, oldIndex);
          oldViews[oldHead]!.toDOM().before(dom);
          oldViews[oldIndex] = null;
        }
        newHead++;
      }
    }

    while (oldHead <= oldTail) {
      if (oldViews[oldHead] !== null) {
        oldViews[oldHead]!.toDOM().remove();
      }
      oldHead++;
    }

    while (newHead <= newTail) {
      const { view, indexSignal } = this._create(items[newHead], newHead);
      newViews[newHead] = view;
      newItems[newHead] = items[newHead];
      newIndexSignals[newHead] = indexSignal;
      const ref = newViews[newTail + 1]?.toDOM();
      if (ref) {
        ref.before(view.toDOM());
      } else {
        container.append(view.toDOM());
      }
      newHead++;
    }

    // Update index signals for views whose position changed.
    for (let i = 0; i < newViews.length; i++) {
      const sig = newIndexSignals[i]!;
      if (sig() !== i) sig(i);
    }

    this._views = newViews;
    this._keys = newKeys;
    this._indexSignals = newIndexSignals as IndexSignal[];
    this._currentItems = newItems;
  }
}
