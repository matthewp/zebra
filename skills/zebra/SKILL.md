---
name: zebra
description: Create view components using the Zebra pattern — a class-based, convention-driven vanilla JavaScript view framework with minimal library code. Use when asked to create a view, component, or UI element using Zebra.
---

# Zebra

A class-based, convention-driven framework for building views using plain JavaScript with native browser APIs. Zebra emphasizes strict structure over abstraction, achieving maximum performance with minimal library code. Views work both client-side and server-side — the same `template()` method produces HTML strings for SSR and DOM elements for the client.

## Structure of a View

Each view is a class that extends `View`. Methods and properties should appear in this order:

1. **State fields** — class field declarations for state
2. **constructor** — calls `super()`, creates child views (no DOM work here)
3. **template(props?)** — returns an HTML string, can embed child views via `slot()`
4. **mount(el)** — calls `super.mount(el)`, caches DOM references, mounts child views, attaches event listeners, sets initial state
5. **State setters** — `setFoo(value)` methods that guard against unnecessary updates
6. **Event handlers** — `onFooClick()` etc.
7. **update(data)** — receives props from parent, calls setters, returns `this.el`

This ordering is a core convention — follow it consistently across all views.

## Base Class

Zebra provides a minimal `View` base class:

```javascript
class View {
  createElement() {
    let tpl = document.createElement('template');
    tpl.innerHTML = this.template();
    this.el = tpl.content.firstElementChild;
    return this.el;
  }

  createAndMount() {
    this.mount(this.createElement());
  }

  template(props) { return ''; }

  mount(el) { this.el = el; }

  update(data = {}) { return this.el; }
}
```

### Key methods

- **`createElement()`** — creates DOM from `template()`, sets `this.el`. Only called for root views or views not embedded via `slot()`.
- **`createAndMount()`** — shorthand for `createElement()` + `mount()`. Used when creating a fresh view on the client.
- **`template(props?)`** — returns an HTML string. Can accept props for SSR data interpolation. Use `slot()` to embed child views.
- **`mount(el)`** — wires up the view to a DOM element. Must call `super.mount(el)` first. Queries nodes, mounts children, attaches listeners.
- **`update(data)`** — receives props, calls setters, returns `this.el`.

### Mounting and hydration

`mount(el)` works the same whether the DOM was just created by `createElement()` or already exists from SSR — `querySelector` works identically in both cases. This means there's no separate "hydrate" concept. The caller decides the source of the element:

```javascript
// Fresh client render
let app = new App();
app.createAndMount();
document.querySelector('#app').append(app.el);

// Hydrate from SSR
let app = new App();
app.mount(document.querySelector('#app > .app'));
```

## The Constructor

The constructor creates child view instances but does no DOM work:

```javascript
constructor() {
  super();
  this.avatar = new Avatar();
}
```

Views without child views don't need a constructor at all.

## Child Views and `slot()`

Use `slot()` to embed child views in a parent's template. The parent's `mount()` then mounts each child onto its portion of the DOM:

```javascript
import { View, slot } from '@matthewp/zebra';
import Avatar from './avatar.js';

class UserCard extends View {
  name = undefined;

  constructor() {
    super();
    this.avatar = new Avatar();
  }

  template() {
    return `<div class="user-card">
      <div class="avatar-container">${slot(this.avatar)}</div>
      <span class="name"></span>
    </div>`;
  }

  mount(el) {
    super.mount(el);
    this.nameNode = el.querySelector('.name');
    this.avatar.mount(el.querySelector('.avatar'));
  }

  setName(value) {
    if (this.name !== value) {
      this.name = value;
      this.nameNode.textContent = value;
    }
  }

  update(data = {}) {
    if ('name' in data) this.setName(data.name);
    return this.el;
  }
}
```

`slot(view, props?)` calls `view.template(props)` and returns the HTML string. On the server, this recursively renders the full view tree as a string. On the client, the parent's DOM already contains the child's HTML from `template()`, so `mount()` just finds it with `querySelector` — no appending needed.

## Server-Side Rendering

The same `template()` that renders client-side HTML works for SSR. Use `renderToString()` from `@matthewp/zebra/server`:

```javascript
import { renderToString } from '@matthewp/zebra/server';
import App from './app.js';

let app = new App();
let html = renderToString(app);
// Returns full HTML string — no DOM required
```

`template()` can accept props to interpolate data for SSR:

```javascript
template(props) {
  return `<span class="name">${props?.name ?? ''}</span>`;
}
```

On the client, `template()` is called with no args (empty/default values), and setters fill in data after `mount()`. On the server, props provide the data directly.

## Complete Example

```javascript
import { View } from '@matthewp/zebra';

class Greeting extends View {
  // State
  name = undefined;

  template(props) {
    return `<div class="greeting">
      Hello <span class="name">${props?.name ?? 'world'}</span>!
    </div>`;
  }

  mount(el) {
    super.mount(el);
    this.nameNode = el.querySelector('.name');
  }

  setName(value) {
    if (this.name !== value) {
      this.name = value;
      this.nameNode.textContent = value;
    }
  }

  update(data = {}) {
    if ('name' in data) this.setName(data.name);
    return this.el;
  }
}

export default Greeting;
```

## Example with Events (Counter)

```javascript
import { View } from '@matthewp/zebra';

class Counter extends View {
  // State
  count = undefined;
  min = 0;

  template() {
    return `<div class="counter">
      <button class="decrement">-</button>
      <span class="count">0</span>
      <button class="increment">+</button>
    </div>`;
  }

  mount(el) {
    super.mount(el);
    this.countNode = el.querySelector('.count');
    this.incrementNode = el.querySelector('.increment');
    this.decrementNode = el.querySelector('.decrement');

    this.incrementNode.addEventListener('click', () => this.onIncrementClick());
    this.decrementNode.addEventListener('click', () => this.onDecrementClick());

    this.setCount(0);
  }

  setCount(value) {
    if (this.count !== value) {
      this.count = value;
      this.countNode.textContent = value;
    }
  }

  onIncrementClick() {
    this.setCount(this.count + 1);
  }

  onDecrementClick() {
    if (this.count - 1 >= this.min) {
      this.setCount(this.count - 1);
    }
  }

  update(data = {}) {
    if ('count' in data) this.setCount(data.count);
    return this.el;
  }
}

export default Counter;
```

## Dispatching Events

Use `CustomEvent` to communicate from child views to parents. Dispatch from the view's root element with `bubbles: true` so events propagate up through the DOM tree:

```javascript
dispatchChange() {
  this.el.dispatchEvent(new CustomEvent('change', {
    detail: { count: this.count },
    bubbles: true
  }));
}
```

A parent listens in its `mount()`:

```javascript
mount(el) {
  super.mount(el);
  el.addEventListener('change', (e) => this.onCounterChange(e));
}

onCounterChange(e) {
  this.setTotal(e.detail.count);
}
```

Because events bubble, a parent can listen for events from deeply nested children without importing or referencing them directly:

```javascript
// A grandchild dispatches:
this.el.dispatchEvent(new CustomEvent('item-delete', {
  detail: { id: this.id },
  bubbles: true
}));

// The top-level app listens, even though it doesn't reference the grandchild:
mount(el) {
  super.mount(el);
  el.addEventListener('item-delete', (e) => this.onItemDelete(e));
}
```

## Lists

For dynamic lists of child views, use the `List` class from `@matthewp/zebra/list`. It handles creating, updating, reordering, and removing child views efficiently using a keyed reconciliation algorithm that minimizes DOM operations.

```javascript
import { List } from '@matthewp/zebra/list';
```

### API

```javascript
let list = new List(ItemView, item => item.id);
```

- **First argument**: the View subclass to instantiate for each item
- **Second argument**: a key function that returns a unique identifier for each item

Embed the list in a parent template with `slot()`, and mount it in `mount()`:

```javascript
import { View, slot } from '@matthewp/zebra';
import { List } from '@matthewp/zebra/list';
import TodoItem from './todo-item.js';

class TodoList extends View {
  constructor() {
    super();
    this.list = new List(TodoItem, todo => todo.id);
  }

  template(props) {
    return `<ul class="todo-list">${slot(this.list, props?.todos)}</ul>`;
  }

  mount(el, todos) {
    super.mount(el);
    this.list.mount(el, todos);
  }

  setTodos(todos) {
    this.list.update(todos);
  }

  update(data = {}) {
    if ('todos' in data) this.setTodos(data.todos);
    return this.el;
  }
}
```

- **`list.template(items)`** — renders all items as HTML strings (for SSR via `slot()`)
- **`list.mount(container, items?)`** — adopts existing child elements in the container, hydrating a view for each one
- **`list.update(items)`** — reconciles the list: creates new views, updates existing ones, removes stale ones, reorders with minimal DOM moves

Each item in the array is passed to the child view's `update()` method. The key function determines identity — items with the same key are updated in place rather than recreated.

## Critical Rules

### Exclusive Mutation

- DOM nodes should only be modified through their corresponding setter method
- State should only be modified through setter methods
- This makes it easy to debug — set a breakpoint in a setter to see every call site

### Props Down, Events Up

- Data flows downward through `update(data)` calls
- Child events bubble up through `CustomEvent`
- Never reach up into parent state

### Conditional Updates

Always check if values changed in setters:

```javascript
setName(value) {
  if (this.name !== value) {
    this.name = value;
    this.nameNode.textContent = value;
  }
}
```

### Event Listeners

Use inline arrow functions in `addEventListener` calls within `mount()`, and define event handler methods as regular methods:

```javascript
mount(el) {
  super.mount(el);
  this.incrementNode = el.querySelector('.increment');
  this.incrementNode.addEventListener('click', () => this.onIncrementClick());
}

onIncrementClick() {
  this.setCount(this.count + 1);
}
```

### DOM Manipulation

Use modern DOM methods — `append`, `prepend`, `replaceWith`, `remove`, `before`, `after` — instead of legacy APIs like `appendChild`, `insertBefore`, `removeChild`, `replaceChild`.

### Exports

Use `export default` for view classes — one view per file.

## TypeScript

When the project uses TypeScript, add types for the public interface and DOM queries. Let inference handle the rest.

### What to type explicitly

**DOM node properties** — `querySelector` returns `Element | null`, so cast:

```typescript
countNode!: HTMLSpanElement;
incrementNode!: HTMLButtonElement;
```

**mount parameter:**

```typescript
mount(el: HTMLElement) {
  super.mount(el);
  this.countNode = el.querySelector('.count') as HTMLSpanElement;
}
```

**update data parameter:**

```typescript
update(data: { count?: number } = {}) {
  if ('count' in data) this.setCount(data.count!);
  return this.el;
}
```

### What to let TypeScript infer

- Setter parameter types (inferred from usage)
- Return types on methods
- State field types (when initialized)

## When Creating Views

1. **Detect file extension**: Check for `tsconfig.json` or existing `.ts` files. Use `.ts` if found, otherwise `.js`
2. Start with the template HTML structure
3. Identify which elements need dynamic updates
4. Create state properties for each piece of dynamic data
5. If the view has children: write a constructor that creates them after `super()`
6. Use `slot()` in the template to embed child views
7. In `mount()`: call `super.mount(el)`, query DOM nodes, mount child views, attach event listeners
8. Create setter methods that check for changes and update DOM
9. Wire up the update method to receive props
