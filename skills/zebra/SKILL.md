---
name: zebra
description: Work with the Zebra framework — a class-based, convention-driven vanilla JavaScript view framework. Use when creating, editing, or refactoring views, components, lists, or UI elements that use Zebra, or when code imports from '@matthewp/zebra'.
---

# Zebra

A class-based, convention-driven framework for building views using plain JavaScript with native browser APIs. Zebra emphasizes strict structure over abstraction, achieving maximum performance with minimal library code. Views work both client-side and server-side — the same `template()` method produces HTML strings for SSR and DOM elements for the client.

## Structure of a View

Each view is a class that extends `View`. Methods and properties should appear in this order:

1. **State fields** — class field declarations for state
2. **constructor** — calls `super()`, creates child views (no DOM work here)
3. **template(props?)** — returns `SafeHTML` using the `html` tagged template literal
4. **mount(el)** — calls `super.mount(el)`, caches DOM references, mounts child views, attaches event listeners, sets initial state
5. **State setters** — `setFoo(value)` methods that guard against unnecessary updates
6. **Event handlers** — `onFooClick()` etc.
7. **update(data)** — receives props from parent, calls setters, returns `this.el`

This ordering is a core convention — follow it consistently across all views.

## Base Class

Zebra provides a minimal `View` base class:

```javascript
class View {
  createElement() { /* parses template once per class, clones DOM per instance */ }
  createAndMount() { this.mount(this.createElement()); }
  template(props) { return html``; }
  mount(el) { this.el = el; }
  update(data = {}) { return this.el; }
}
```

### Key methods

- **`createElement()`** — parses `template()` into DOM once per class (cached on the constructor), then `cloneNode`s the cached element for each instance. Only called for root views or views not embedded via slot.
- **`createAndMount()`** — shorthand for `createElement()` + `mount()`. Used when creating a fresh view on the client.
- **`template(props?)`** — returns `SafeHTML`. Called once per class to build the template cache; props are only used for SSR. Write it as a compact single-line string — **no whitespace between elements** (whitespace creates extra text nodes in every clone). For elements whose text content will be set dynamically, put a single space placeholder so a text node already exists in every clone.
- **`mount(el)`** — wires up the view to a DOM element. Must call `super.mount(el)` first. For dynamic text cells, cache the **text node** (`el.querySelector('.foo').firstChild`) not the element — this allows in-place `.data` mutation in setters.
- **`update(data)`** — receives props, calls setters, returns `this.el`.

### Setters update text nodes, not elements

Cache a reference to the text node in `mount()`, then update via `.data` in the setter. Setting `.textContent` on an element destroys and recreates its text node on every call; `.data` on a text node mutates it in place.

```javascript
// mount: cache the text node
this.nameText = el.querySelector('.name').firstChild;

// setter: in-place mutation
setName(value) {
  if (this.name !== value) {
    this.name = value;
    this.nameText.data = value;
  }
}
```

### Mounting and hydration

`mount(el)` works the same whether the DOM was just created by `createElement()` or already exists from SSR — `querySelector` works identically in both cases. There is no separate "hydrate" concept:

```javascript
// Fresh client render
let app = new App();
app.createAndMount();
document.querySelector('#app').append(app.el);

// Hydrate from SSR
let app = new App();
app.mount(document.querySelector('#app > .app'));
```

## The `html` Tagged Template Literal

Use the `html` tagged template literal from `@matthewp/zebra` for all templates. It automatically HTML-escapes interpolated values, preventing XSS:

```javascript
import { View, html } from '@matthewp/zebra';

class UserCard extends View {
  template(props) {
    // props.bio is escaped automatically — no manual escaping needed
    return html`<div class="card"><p class="bio">${props?.bio ?? ''}</p></div>`;
  }
}
```

### Interpolation behavior

- **Strings and numbers** — automatically HTML-escaped (`<script>` becomes `&lt;script&gt;`)
- **`null`, `undefined`, `false`** — render as empty string
- **View or List instances** — automatically rendered via `.template()` (no need for `slot()`)
- **`SafeHTML` values** (from `html` or `unsafeHTML()`) — passed through without escaping
- **Arrays** — each element resolved by the same rules and joined

### Raw HTML escape hatch

When you need to insert pre-rendered HTML (e.g. markdown output), use `unsafeHTML()`:

```javascript
import { html, unsafeHTML } from '@matthewp/zebra';

template(props) {
  return html`<div class="content">${unsafeHTML(props?.renderedMarkdown ?? '')}</div>`;
}
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

## Child Views

Embed child views by interpolating them in the `html` template. The parent's `mount()` then mounts each child onto its portion of the DOM:

```javascript
import { View, html } from '@matthewp/zebra';
import Avatar from './avatar.js';

class UserCard extends View {
  name = undefined;

  constructor() {
    super();
    this.avatar = new Avatar();
  }

  template() {
    return html`<div class="user-card"><div class="avatar-container">${this.avatar}</div><span class="name"> </span></div>`;
  }

  mount(el) {
    super.mount(el);
    this.nameText = el.querySelector('.name').firstChild;
    this.avatar.mount(el.querySelector('.avatar'));
  }

  setName(value) {
    if (this.name !== value) {
      this.name = value;
      this.nameText.data = value;
    }
  }

  update(data = {}) {
    if ('name' in data) this.setName(data.name);
    return this.el;
  }
}
```

Interpolating a View calls its `template()` and embeds the resulting HTML. On the server, this recursively renders the full view tree as a string. On the client, the parent's DOM already contains the child's HTML, so `mount()` just finds it with `querySelector`.

`slot(view, props?)` is available from `@matthewp/zebra` for when you need to pass arguments to a child's `template()` — most commonly for passing items to a `List` for SSR. For child views without args, just interpolate directly.

## Server-Side Rendering

The same `template()` that renders client-side HTML works for SSR. Use `renderToString()` from `@matthewp/zebra/server`:

```javascript
import { renderToString } from '@matthewp/zebra/server';
import App from './app.js';

let app = new App();
let html = renderToString(app);
// Returns full HTML string — no DOM required
```

`template()` can accept props to interpolate data for SSR. Values are automatically escaped:

```javascript
template(props) {
  return html`<span class="name">${props?.name ?? ''}</span>`;
}
```

On the client, `template()` is called with no args (empty/default values), and setters fill in data after `mount()`. On the server, props provide the data directly.

## Complete Example

```javascript
import { View, html } from '@matthewp/zebra';

class Greeting extends View {
  name = undefined;

  // Compact template, space seeds the text node for .data updates
  template() {
    return html`<div class="greeting">Hello <span class="name"> </span>!</div>`;
  }

  mount(el) {
    super.mount(el);
    // Cache the text node, not the element
    this.nameText = el.querySelector('.name').firstChild;
  }

  setName(value) {
    if (this.name !== value) {
      this.name = value;
      this.nameText.data = value;  // in-place, no node recreation
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
import { View, html } from '@matthewp/zebra';

class Counter extends View {
  count = undefined;
  min = 0;

  template() {
    return html`<div class="counter"><button class="decrement">-</button><span class="count"> </span><button class="increment">+</button></div>`;
  }

  mount(el) {
    super.mount(el);
    this.countText = el.querySelector('.count').firstChild;
    this.incrementNode = el.querySelector('.increment');
    this.decrementNode = el.querySelector('.decrement');

    this.incrementNode.addEventListener('click', () => this.onIncrementClick());
    this.decrementNode.addEventListener('click', () => this.onDecrementClick());

    this.setCount(0);
  }

  setCount(value) {
    if (this.count !== value) {
      this.count = value;
      this.countText.data = value;
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

Embed the list in a parent template by interpolation, and mount it in `mount()`:

```javascript
import { View, slot, html } from '@matthewp/zebra';
import { List } from '@matthewp/zebra/list';
import TodoItem from './todo-item.js';

class TodoList extends View {
  constructor() {
    super();
    this.list = new List(TodoItem, todo => todo.id);
  }

  template(props) {
    return html`<ul class="todo-list">${this.list.template(props?.todos)}</ul>`;
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

- **`list.template(items)`** — renders all items as HTML strings (for SSR)
- **`list.mount(container, items?)`** — adopts existing child elements in the container, hydrating a view for each one
- **`list.update(items)`** — reconciles the list: creates new views, updates existing ones, removes stale ones, reorders with minimal DOM moves

Each item in the array is passed to the child view's `update()` method. The key function determines identity — items with the same key are updated in place rather than recreated.

**Pass object references, not copies.** `List.update()` uses referential equality (`===`) to skip `update()` calls on unchanged items. Only create new object references for items that actually changed:

```javascript
// Good — unchanged items keep the same reference; List skips their update()
rows[i] = { ...rows[i], label: rows[i].label + ' !!!' };

// Bad — every item gets a new reference; List calls update() on all of them
rows = rows.map(row => ({ ...row }));
```

## Critical Rules

### Exclusive Mutation

- DOM nodes should only be modified through their corresponding setter method
- State should only be modified through setter methods
- This makes it easy to debug — set a breakpoint in a setter to see every call site
- **Never manipulate a child view's DOM directly** — all communication with child views must go through their `update()` method. Don't touch `view.el.classList`, `view.someNode`, etc. from the parent. If the child needs new behavior, add a setter and wire it through `update()`.

### Props Down, Events Up

- Data flows downward through `update(data)` calls
- Child events bubble up through `CustomEvent`
- Never reach up into parent state

### Conditional Updates

Always guard setters with an equality check:

```javascript
setName(value) {
  if (this.name !== value) {
    this.name = value;
    this.nameText.data = value;
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

**DOM node properties** — declare as `Text` for text nodes, element types for everything else:

```typescript
nameText!: Text;
incrementNode!: HTMLButtonElement;
```

**mount parameter:**

```typescript
mount(el: HTMLElement) {
  super.mount(el);
  this.nameText = el.querySelector('.name')!.firstChild as Text;
  this.incrementNode = el.querySelector('.increment') as HTMLButtonElement;
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

## Performance Notes

Zebra's template mechanism parses `template()` HTML once per class and `cloneNode`s the result for every instance — so creation cost scales only with clone size, not with parsing. The patterns shown throughout this document keep that cost minimal:

- **Compact templates** (no whitespace between elements) avoid extra text nodes in every clone. For 1000 list rows, even 4 extra text nodes per row is 4000 extra DOM nodes affecting layout and paint.
- **Space placeholders + `.data`** avoid the DOM churn of `textContent` (which removes all children and creates a new text node on every call). `.data` on a pre-existing text node mutates it in place.

**Direct DOM traversal** (`firstChild`/`nextSibling` instead of `querySelector`) removes measurable overhead from `mount()` in views that are created thousands of times in tight loops. Use it only when profiling confirms a bottleneck — `querySelector` is preferred for readability everywhere else.

## When Creating Views

1. **Detect file extension**: Check for `tsconfig.json` or existing `.ts` files. Use `.ts` if found, otherwise `.js`
2. Start with the template HTML — write it as a compact single-line string, no whitespace between elements
3. For elements whose text content is dynamic, put a single space in them so a text node is seeded
4. Create state field declarations for each piece of dynamic data
5. If the view has children: write a constructor that creates them after `super()`
6. Use `html` tagged template literal — child views embedded by interpolation, `slot()` for lists with data
7. In `mount()`: call `super.mount(el)`, cache **text node** references (`.querySelector('.foo').firstChild`) for dynamic cells, mount child views, attach event listeners
8. Write setter methods that guard with `!==` and update via `.data` on text nodes
9. Wire up `update(data)` to call the setters
