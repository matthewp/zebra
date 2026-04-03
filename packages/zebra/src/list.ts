import { View } from './view.ts';

type ViewConstructor = new () => View;

export class List<T = Record<string, unknown>> {
  private ViewClass: ViewConstructor;
  private keyFn: (item: T) => unknown;
  private views: (View | null)[] = [];
  private keys: unknown[] = [];
  private container: HTMLElement | null = null;

  constructor(ViewClass: ViewConstructor, keyFn: (item: T) => unknown) {
    this.ViewClass = ViewClass;
    this.keyFn = keyFn;
  }

  template(items?: T[]): string {
    if (!items || items.length === 0) return '';
    return items.map(item => {
      let view = new this.ViewClass();
      return view.template(item as unknown as Record<string, unknown>);
    }).join('');
  }

  mount(container: HTMLElement, items?: T[]) {
    this.container = container;
    let children = Array.from(container.children) as HTMLElement[];
    if (children.length > 0 && items) {
      for (let i = 0; i < children.length && i < items.length; i++) {
        let view = new this.ViewClass();
        view.mount(children[i]);
        view.update(items[i] as unknown as Record<string, unknown>);
        this.views.push(view);
        this.keys.push(this.keyFn(items[i]));
      }
    }
  }

  private updateView(view: View, item: T) {
    view.update(item as unknown as Record<string, unknown>);
  }

  update(items: T[]) {
    let container = this.container!;
    let oldViews = this.views;
    let oldKeys = this.keys;
    let newKeys = items.map(this.keyFn);
    let newViews: (View | null)[] = new Array(items.length).fill(null);

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
        this.updateView(oldViews[oldHead]!, items[newHead]);
        oldHead++;
        newHead++;
      } else if (oldKeys[oldTail] === newKeys[newTail]) {
        // Tail-Tail match
        newViews[newTail] = oldViews[oldTail];
        this.updateView(oldViews[oldTail]!, items[newTail]);
        oldTail--;
        newTail--;
      } else if (oldKeys[oldHead] === newKeys[newTail]) {
        // Head-Tail match: move old head to after old tail
        newViews[newTail] = oldViews[oldHead];
        this.updateView(oldViews[oldHead]!, items[newTail]);
        oldViews[oldTail]!.el.after(oldViews[oldHead]!.el);
        oldHead++;
        newTail--;
      } else if (oldKeys[oldTail] === newKeys[newHead]) {
        // Tail-Head match: move old tail to before old head
        newViews[newHead] = oldViews[oldTail];
        this.updateView(oldViews[oldTail]!, items[newHead]);
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
          oldViews[oldHead]!.el.before(view.el);
          this.updateView(view, items[newHead]);
        } else {
          // Move existing
          let view = oldViews[oldIndex]!;
          this.updateView(view, items[newHead]);
          newViews[newHead] = view;
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
      let el = view.el;
      let ref = newViews[newTail + 1]?.el;
      if (ref) {
        ref.before(el);
      } else {
        container.append(el);
      }
      this.updateView(view, items[newHead]);
      newHead++;
    }

    this.views = newViews;
    this.keys = newKeys;
  }
}
