import { View } from './view.ts';
import { SafeHTML } from './html.ts';

type ViewConstructor<T> = new () => View<T>;

export class List<T = Record<string, unknown>> {
  private ViewClass: ViewConstructor<T>;
  private keyFn: (item: T) => unknown;
  private views: (View<T> | null)[] = [];
  private keys: unknown[] = [];
  private items: (T | null)[] = [];
  private container: HTMLElement | null = null;

  constructor(ViewClass: ViewConstructor<T>, keyFn: (item: T) => unknown) {
    this.ViewClass = ViewClass;
    this.keyFn = keyFn;
  }

  template(items?: T[]): SafeHTML {
    if (!items || items.length === 0) return new SafeHTML('');
    return new SafeHTML(items.map(item => {
      let view = new this.ViewClass();
      return view.template(item).toString();
    }).join(''));
  }

  mount(container: HTMLElement, items?: T[]) {
    this.container = container;
    let children = Array.from(container.children) as HTMLElement[];
    if (children.length > 0 && items) {
      for (let i = 0; i < children.length && i < items.length; i++) {
        let view = new this.ViewClass();
        view.mount(children[i]);
        view.update(items[i]);
        this.views.push(view);
        this.keys.push(this.keyFn(items[i]));
        this.items.push(items[i]);
      }
    }
  }

  private updateView(view: View<T>, newItem: T, oldItem: T | null) {
    if (newItem !== oldItem) view.update(newItem);
  }

  update(items: T[]) {
    let container = this.container!;
    let oldViews = this.views;
    let oldKeys = this.keys;
    let oldItems = this.items;

    // Fast path: same length + all keys in same order → pure in-place update
    if (items.length === oldViews.length && items.length > 0) {
      let sameOrder = true;
      let newKeys2 = new Array(items.length);
      for (let i = 0; i < items.length; i++) {
        newKeys2[i] = this.keyFn(items[i]);
        if (newKeys2[i] !== oldKeys[i]) { sameOrder = false; break; }
      }
      if (sameOrder) {
        for (let i = 0; i < items.length; i++) {
          if (items[i] !== oldItems[i]) oldViews[i]!.update(items[i]);
          this.items[i] = items[i];
        }
        return;
      }
    }

    let newKeys = items.map(this.keyFn);
    let newViews: (View<T> | null)[] = new Array(items.length).fill(null);
    let newItems: (T | null)[] = new Array(items.length).fill(null);

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
        // Head-Head match
        newViews[newHead] = oldViews[oldHead];
        newItems[newHead] = items[newHead];
        this.updateView(oldViews[oldHead]!, items[newHead], oldItems[oldHead]);
        oldHead++;
        newHead++;
      } else if (oldKeys[oldTail] === newKeys[newTail]) {
        // Tail-Tail match
        newViews[newTail] = oldViews[oldTail];
        newItems[newTail] = items[newTail];
        this.updateView(oldViews[oldTail]!, items[newTail], oldItems[oldTail]);
        oldTail--;
        newTail--;
      } else if (oldKeys[oldHead] === newKeys[newTail]) {
        // Head-Tail match: move old head to after old tail
        newViews[newTail] = oldViews[oldHead];
        newItems[newTail] = items[newTail];
        this.updateView(oldViews[oldHead]!, items[newTail], oldItems[oldHead]);
        oldViews[oldTail]!.el.after(oldViews[oldHead]!.el);
        oldHead++;
        newTail--;
      } else if (oldKeys[oldTail] === newKeys[newHead]) {
        // Tail-Head match: move old tail to before old head
        newViews[newHead] = oldViews[oldTail];
        newItems[newHead] = items[newHead];
        this.updateView(oldViews[oldTail]!, items[newHead], oldItems[oldTail]);
        oldViews[oldHead]!.el.before(oldViews[oldTail]!.el);
        oldTail--;
        newHead++;
      } else {
        // Build map lazily
        if (!oldKeyToIndex) {
          oldKeyToIndex = new Map();
          for (let i = oldHead; i <= oldTail; i++) {
            if (oldViews[i] !== null) {
              oldKeyToIndex.set(oldKeys[i], i);
            }
          }
        }

        let oldIndex = oldKeyToIndex.get(newKeys[newHead]);
        if (oldIndex === undefined) {
          // New item
          let view = new this.ViewClass();
          view.createAndMount();
          newViews[newHead] = view;
          newItems[newHead] = items[newHead];
          oldViews[oldHead]!.el.before(view.el);
          this.updateView(view, items[newHead], null);
        } else {
          // Move existing
          let view = oldViews[oldIndex]!;
          this.updateView(view, items[newHead], oldItems[oldIndex]);
          newViews[newHead] = view;
          newItems[newHead] = items[newHead];
          oldViews[oldHead]!.el.before(view.el);
          oldViews[oldIndex] = null;
        }
        newHead++;
      }
    }

    // Remove remaining old items
    while (oldHead <= oldTail) {
      if (oldViews[oldHead] !== null) {
        oldViews[oldHead]!.el.remove();
      }
      oldHead++;
    }

    // Add remaining new items
    while (newHead <= newTail) {
      let view = new this.ViewClass();
      view.createAndMount();
      newViews[newHead] = view;
      newItems[newHead] = items[newHead];
      let el = view.el;
      let ref = newViews[newTail + 1]?.el;
      if (ref) {
        ref.before(el);
      } else {
        container.append(el);
      }
      this.updateView(view, items[newHead], null);
      newHead++;
    }

    this.views = newViews;
    this.keys = newKeys;
    this.items = newItems;
  }
}
