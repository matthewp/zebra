import { Element } from './element.ts';
import { View } from './view.ts';
import { effect } from 'alien-signals';

type ItemSource<T> = T[] | (() => T[]);
type Factory<T> = (item: T) => View;

export class List<T = unknown> extends View {
  private _containerTag: string;
  private _items: ItemSource<T>;
  private _keyFn: (item: T) => unknown;
  private _factory: Factory<T>;
  private _views: (View | null)[] = [];
  private _keys: unknown[] = [];
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
    this._currentItems = [];
    for (const item of items) {
      const view = this._factory(item);
      this._views.push(view);
      this._keys.push(this._keyFn(item));
      this._currentItems.push(item);
      container.append(view);
    }
  }

  private _updateView(view: View, newItem: T, oldItem: T | null): void {
    if (newItem !== oldItem) {
      const anyView = view as any;
      if (typeof anyView.update === 'function') {
        anyView.update(newItem);
      }
    }
  }

  private _reconcile(container: HTMLElement, items: T[]): void {
    const oldViews = this._views;
    const oldKeys = this._keys;
    const oldItems = this._currentItems;

    // Fast path: same length + all keys in same order
    if (items.length === oldViews.length && items.length > 0) {
      let sameOrder = true;
      const newKeys2 = new Array(items.length);
      for (let i = 0; i < items.length; i++) {
        newKeys2[i] = this._keyFn(items[i]);
        if (newKeys2[i] !== oldKeys[i]) { sameOrder = false; break; }
      }
      if (sameOrder) {
        for (let i = 0; i < items.length; i++) {
          if (items[i] !== oldItems[i]) this._updateView(oldViews[i]!, items[i], oldItems[i]);
          this._currentItems[i] = items[i];
        }
        return;
      }
    }

    const newKeys = items.map(this._keyFn);
    const newViews: (View | null)[] = new Array(items.length).fill(null);
    const newItems: (T | null)[] = new Array(items.length).fill(null);

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
        newViews[newHead] = oldViews[oldHead];
        newItems[newHead] = items[newHead];
        this._updateView(oldViews[oldHead]!, items[newHead], oldItems[oldHead]);
        oldHead++;
        newHead++;
      } else if (oldKeys[oldTail] === newKeys[newTail]) {
        newViews[newTail] = oldViews[oldTail];
        newItems[newTail] = items[newTail];
        this._updateView(oldViews[oldTail]!, items[newTail], oldItems[oldTail]);
        oldTail--;
        newTail--;
      } else if (oldKeys[oldHead] === newKeys[newTail]) {
        newViews[newTail] = oldViews[oldHead];
        newItems[newTail] = items[newTail];
        this._updateView(oldViews[oldHead]!, items[newTail], oldItems[oldHead]);
        oldViews[oldTail]!.toDOM().after(oldViews[oldHead]!.toDOM());
        oldHead++;
        newTail--;
      } else if (oldKeys[oldTail] === newKeys[newHead]) {
        newViews[newHead] = oldViews[oldTail];
        newItems[newHead] = items[newHead];
        this._updateView(oldViews[oldTail]!, items[newHead], oldItems[oldTail]);
        oldViews[oldHead]!.toDOM().before(oldViews[oldTail]!.toDOM());
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
          const view = this._factory(items[newHead]);
          newViews[newHead] = view;
          newItems[newHead] = items[newHead];
          oldViews[oldHead]!.toDOM().before(view.toDOM());
        } else {
          const view = oldViews[oldIndex]!;
          this._updateView(view, items[newHead], oldItems[oldIndex]);
          newViews[newHead] = view;
          newItems[newHead] = items[newHead];
          oldViews[oldHead]!.toDOM().before(view.toDOM());
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
      const view = this._factory(items[newHead]);
      newViews[newHead] = view;
      newItems[newHead] = items[newHead];
      const ref = newViews[newTail + 1]?.toDOM();
      if (ref) {
        ref.before(view.toDOM());
      } else {
        container.append(view.toDOM());
      }
      newHead++;
    }

    this._views = newViews;
    this._keys = newKeys;
    this._currentItems = newItems;
  }
}
