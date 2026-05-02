---
name: zebra
description: Work with the Zebra framework — a class-based view framework using signals and imperative DOM construction. Use when creating, editing, or refactoring views, components, lists, or UI elements that use Zebra, or when code imports from '@matthewp/zebra'.
---

# Zebra

Zebra is a class-based view framework. Views are plain classes; you build DOM trees by composing typed element wrappers (`Div`, `Span`, `Button`, etc.), wire reactivity with signals and effects, and the same code renders on the server (`toString()`) or the client (`mount()`).

The framework leans into imperative DOM construction. Instead of a template DSL, you call methods like `.append()`, `.addClass()`, `.setText()` to build a tree and `effect(() => ...)` to keep parts of it in sync with signals.

## Anatomy of a View

```javascript
import { View, Div, Span, Button, signal, effect } from '@matthewp/zebra';

class Counter extends View {
  count = signal(0);

  render() {
    const root = new Div().addClass('counter');
    const span = new Span();
    const inc = new Button()
      .setText('+')
      .on('click', () => this.count(this.count() + 1));

    effect(() => {
      span.setText(String(this.count()));
    });

    root.append(span, inc);
    return root;
  }
}
```

Three building blocks:

1. **State fields** declared as `signal(...)`, `computed(...)`, or plain values.
2. **`render()`** builds the element tree, wires events with `.on()`, wires reactivity with `effect()`, and returns the root `Element`.
3. **Event handlers** are regular methods (or inline arrows) that update signals.

## The Class Hierarchy

```
Node (abstract)
├── Element        — wraps one HTML tag, holds attrs/classes/styles/children
│   ├── Div, Span, Button, Input, ...  (tag subclasses)
│   └── View       — component with render()
│       └── List   — keyed reconciliation
├── Fragment       — multiple siblings, no wrapper tag
└── RawHTML        — escape hatch for pre-rendered HTML strings
```

`Node` provides the shared API (`append`, `addClass`, `setStyle`, ...). Methods on `Element` operate on its own state and DOM. Methods on `Fragment` broadcast to its element children.

Sitting outside the `Node` tree are `Document` and `Window` — handles for attaching global event listeners with View-scoped lifetimes. They aren't part of the rendered DOM; see **Global events** below.

## Element

`Element` is the building block for DOM. Use the tag subclasses (`Div`, `Span`, `Button`, `Input`, ...) — never `new Element('div')` directly when a subclass exists. The full list is in the **Method reference** at the bottom.

```javascript
const link = new Anchor()
  .setAttribute('href', '/about')
  .addClass('nav-link')
  .setText('About');
```

All mutation methods return `this` for chaining.

### Lazy DOM

`Element` does **not** create a DOM node when constructed — only when `toDOM()` or `mount()` is called. This is what makes the same code work for SSR (`toString()` never touches a DOM) and the client.

After mount, `el` holds the real `HTMLElement`. Methods that mutate state (e.g. `addClass`) update both the internal state *and* the live DOM if mounted.

```javascript
const div = new Div().addClass('foo');  // no DOM yet
div.toString();                          // '<div class="foo"></div>'
div.mount(document.body);                // creates DOM, appends to body
div.addClass('bar');                     // updates state AND div.el.classList
```

### Composing children

Elements compose by `.append()` — accepts other `Node`s and strings:

```javascript
const card = new Div().addClass('card').append(
  new H2().setText('Title'),
  new P().setText('Body text'),
  new Anchor().setAttribute('href', '/more').setText('Read more'),
);
```

Strings are HTML-escaped automatically in `toString()`. To insert pre-rendered HTML, use `setHTML()` or append a `RawHTML` node — both are explicit escape hatches.

## View

A `View` is a class with a `render()` method that returns an `Element`. It extends `Element`, so you can `append(view)` it anywhere.

```javascript
class UserCard extends View {
  user = signal({ name: '', bio: '' });

  render() {
    const root = new Div().addClass('user-card');
    const name = new H3();
    const bio = new P();

    effect(() => {
      const u = this.user();
      name.setText(u.name);
      bio.setText(u.bio);
    });

    root.append(name, bio);
    return root;
  }
}
```

`render()` is called **once**, lazily, and the result is cached. Effects set up inside `render()` live for the lifetime of the view. **Don't write logic that expects `render()` to be re-called** — that's what effects are for.

### Mounting

```javascript
// Client
const card = new UserCard();
card.mount(document.querySelector('#app'));

// SSR
const card = new UserCard();
const html = card.toString();
```

### Composing views

Views are nodes — append them like any other element:

```javascript
class App extends View {
  header = new Header();
  list = new TodoList();

  render() {
    return new Div().addClass('app').append(this.header, this.list);
  }
}
```

Declare child views as **fields**, not inside `render()`, so they survive `render()` running once.

## Signals & Effects

State is held in **signals**. A signal is a function: call with no args to read, with one arg to write.

```javascript
import { signal, computed, effect } from '@matthewp/zebra';

const count = signal(0);
count();        // 0
count(5);       // sets to 5
count();        // 5

const doubled = computed(() => count() * 2);
doubled();      // 10

effect(() => {
  console.log('count is', count());
});
count(7);       // logs "count is 7"
```

### When to use which

- **`signal(v)`** — mutable state owned by a view.
- **`computed(() => ...)`** — derived value from one or more signals. Cached; only recomputes when dependencies change.
- **`effect(() => ...)`** — side effect (DOM update, log, fetch). Re-runs whenever a signal it read changes.

### Effects for DOM updates

Inside `render()`, use `effect()` to bind reactive state to the DOM:

```javascript
effect(() => {
  span.setText(String(this.count()));
});

effect(() => {
  button.toggleClass('active', this.isActive());
});

effect(() => {
  link.setAttribute('href', this.url());
});

effect(() => {
  this.isVisible() ? content.show() : content.hide();
});
```

Multiple operations in one effect is fine — they all run together when any read signal changes:

```javascript
effect(() => {
  const t = this.todo();
  text.setText(t.text);
  checkbox.setChecked(t.done);
  root.toggleClass('completed', t.done);
});
```

Effects run **immediately** the first time they're set up (during `render()`), so initial state lands without any extra plumbing.

## Events

### Listening

Use `.on(event, handler)`:

```javascript
button.on('click', () => this.onIncrement());
form.on('submit', (e) => {
  e.preventDefault();
  this.submit();
});
```

For events from descendants, listen on the parent — events bubble:

```javascript
class TodoList extends View {
  render() {
    const root = new Ul().addClass('todo-list');
    root.on('todo-toggle', (e) => this.handleToggle(e));
    root.on('delete', (e) => this.handleDelete(e));
    return root;
  }
}
```

### Dispatching

Use `.emit(name, detail?, options?)` instead of constructing `CustomEvent` manually. Bubbling is on by default:

```javascript
class TodoItem extends View {
  onToggle() {
    this.emit('todo-toggle', { id: this.todo().id });
  }
}
```

## Global events

For events that don't bubble to a single element — `keydown` on `document`, `resize` / `scroll` / `popstate` on `window` — use `Document` and `Window`. Construct them inside `render()` and call `.on()`:

```javascript
import { View, Div, Document, Window } from '@matthewp/zebra';

class Modal extends View {
  render() {
    new Document().on('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    new Window().on('resize', () => this.recompute());

    return new Div().addClass('modal').append(/* ... */);
  }
}
```

What you don't have to do: track listeners, remove them on unmount, hold onto a reference. The handle scopes itself to the View it's created inside; when that View's element leaves the DOM, the listeners are removed automatically.

Two rules:
- **Construct inside `render()`** so the active-View context picks them up. A `new Document()` outside a render isn't scoped to anything and won't auto-clean.
- **SSR-safe.** `Document` and `Window` don't touch the global `document` / `window` until the View is mounted, so `toString()` on the server is fine.

Form elements have typed value methods — never reach for `.el.value` directly.

```javascript
const input = new Input().setAttribute('type', 'text');

input.on('input', () => this.query(input.getValue()));

effect(() => {
  if (!input.isFocused()) input.setValue(this.query());
});
```

Methods:
- `Input` / `Textarea` / `Select` — `setValue(s)` / `getValue()`
- `Input` (checkboxes) — `setChecked(bool)` / `isChecked()`
- All — `isFocused()`, `focus()`, `blur()`

## Lists

Use `List` for dynamic, keyed children. It does keyed reconciliation — items with the same key are updated in place rather than recreated.

```javascript
import { List } from '@matthewp/zebra';

this.list = new List(
  () => this.items(),                  // items source: signal getter or array
  item => item.id,                      // key function
  item => new ItemView(item),           // factory: creates a view for an item
  'ul',                                 // optional: container tag (default 'div')
).addClass('item-list');
```

When the items signal changes, `List` reconciles the DOM:
- Items with new keys are created via the factory
- Items with existing keys are updated in place via `view.update(item)`
- Removed items are detached
- Reordering uses minimal DOM moves

The factory creates a view per item. Implement `update(item)` on the item view (typically by writing to a signal) so reconciliation can refresh existing instances:

```javascript
class TodoItem extends View {
  todo;

  constructor(initial) {
    super();
    this.todo = signal(initial);
  }

  render() {
    const root = new Li().addClass('todo-item');
    const text = new Span();

    effect(() => {
      text.setText(this.todo().text);
      root.toggleClass('completed', this.todo().done);
    });

    root.append(text);
    return root;
  }

  update(todo) {
    this.todo(todo);
  }
}
```

**Pass new object references for changed items, keep references for unchanged ones.** `List` uses `===` to skip `update()` calls on unchanged items:

```javascript
// Good — only the toggled item gets a new reference
this.todos(this.todos().map(t =>
  t.id === id ? { ...t, done: !t.done } : t
));

// Bad — every item gets a new reference; List calls update() on all of them
this.todos(this.todos().map(t => ({ ...t })));
```

## Fragment

Use `Fragment` to group multiple siblings without a wrapping tag. Common when:
- A `<tr>` or grid layout where an extra wrapper would break CSS
- A logical group of nodes you want to apply a class to as a unit (Fragment broadcasts methods to its element children)

```javascript
import { Fragment } from '@matthewp/zebra';

const cells = new Fragment().append(
  new Td().setText('A'),
  new Td().setText('B'),
  new Td().setText('C'),
);
cells.addClass('cell');  // applies to each Td
row.append(cells);
```

`Fragment` does not have its own DOM after mount — its children are adopted by the parent. It's a build-time grouping.

## Models

State that's owned outside of any single view — async data, shared mutations, anything that should round-trip through SSR — belongs in a **Model**. A Model is a class that holds signals and exposes methods to mutate them. Views consume a model via constructor injection.

Extend the `Model` base class for built-in `loading` / `error` signals, an async `run()` helper, and `toJSON()`/`fromJSON()` for SSR data round-trip.

```javascript
import { Model, signal } from '@matthewp/zebra';

export class WeatherModel extends Model {
  zip = signal('');
  data = signal(null);

  async load(zip) {
    this.zip(zip);
    await this.run(async () => {
      const res = await fetch(`/weather/${zip}`);
      if (!res.ok) throw new Error('Lookup failed');
      this.data(await res.json());
    });
  }
}
```

`run(asyncFn)` toggles `loading` true → runs the function → captures any thrown error into the `error` signal → toggles `loading` false in `finally`. Replaces the try/catch/finally dance every async method otherwise needs.

### Consuming a model in a view

```javascript
class Weather extends View {
  constructor(model = new WeatherModel()) {
    super();
    this.model = model;
  }

  render() {
    const root = new Div();
    const status = new P();
    const display = new Div();

    effect(() => {
      if (this.model.loading()) status.setText('Loading…').show();
      else if (this.model.error()) status.setText(this.model.error()).show();
      else status.hide();
    });

    effect(() => {
      const d = this.model.data();
      if (d) display.setText(`${d.tempF}°F`).show();
      else display.hide();
    });

    root.append(status, display);
    return root;
  }
}
```

The view doesn't own the data — it observes it. Mutations happen on the model (e.g. `this.model.load(zip)` from an event handler).

### Serialization (SSR round-trip)

`Model.toJSON()` walks signal-valued fields (skipping `loading` and `error`) and returns their current values. `Model.fromJSON(json)` writes them back.

```javascript
// Server
const model = new WeatherModel();
await model.load('47150');
const view = new Weather(model);
const html = view.toString();
const data = JSON.stringify(model.toJSON());
res.send(`...
  <div id="app">${html}</div>
  <script id="model-data" type="application/json">${data}</script>
`);

// Client
const data = JSON.parse(document.getElementById('model-data').textContent);
const model = new WeatherModel().fromJSON(data);
const view = new Weather(model);
view.hydrate(document.querySelector('#app').firstElementChild);
```

The client constructs the same model state the server had, so `render()` produces an identical tree → hydration matches the SSR'd HTML.

### When not to use Model

Don't use `Model` for purely view-local state. A counter's count, a tab's active index, a form's draft input value — those live as `signal()` fields directly on the view. Reach for `Model` when:
- The state is async (loading / error matters)
- Multiple views read it
- It needs to round-trip through SSR

## Server-side rendering & hydration

Same code, no DOM needed on the server:

```javascript
import { App } from './app.ts';

const html = new App().toString();
// '<div class="app">...</div>'
```

`toString()` walks the element tree without ever calling `document.createElement`. Safe to call on Node.js with no DOM shim.

### Hydration

On the client, **don't call `mount()` if SSR'd HTML is already on the page** — that would build fresh DOM and double-render. Use `hydrate(el)` instead. It runs `render()` (so effects get set up), then walks the existing DOM in parallel and adopts each node, attaching event listeners as it goes.

```javascript
const app = new App();
const existing = document.querySelector('#app').firstElementChild;
if (existing) {
  app.hydrate(existing);
} else {
  app.mount(document.querySelector('#app'));
}
```

After hydrate, the view is fully reactive — signals propagate through effects to update the live DOM, just like with `mount()`.

### How hydration works

`render()` is deterministic: given the same initial signal values, it builds the same tree on server and client. Server's `toString()` and client's `hydrate()` walk that tree in lockstep:
- For each `Element` child, claim the next DOM child as its `el` and recurse.
- For each string child, claim a text node and advance.
- Listeners attached via `.on()` are wired to the adopted DOM node (the server HTML didn't have them).

This means **render must be deterministic across server and client** — same signals, same render output. Don't read from `Date.now()`, `Math.random()`, or browser-only APIs inside `render()` unless you're prepared for hydration mismatches.

### What's not yet supported

`hydrate()` doesn't currently handle `Fragment` or `RawHTML` nodes — it throws a clear error if it hits one. For trees containing those, fall back to `mount()`.

## Critical Rules

### Never reach for `this.el` from a view

The framework provides typed methods for every common DOM operation. Use them instead of `this.el.foo`:

| Want to... | Use |
|---|---|
| Read input value | `input.getValue()` |
| Write input value | `input.setValue(v)` |
| Read checkbox state | `input.isChecked()` |
| Write checkbox state | `input.setChecked(b)` |
| Check focus | `el.isFocused()` |
| Focus / blur | `el.focus()` / `el.blur()` |
| Read layout (offsetLeft, etc.) | `el.measure(e => e.offsetLeft)` |
| Dispatch event | `el.emit('name', detail)` |
| Set innerHTML | `el.setHTML(html)` |
| Empty children | `el.clear()` |
| Detach from DOM | `el.remove()` |

The only legitimate raw-DOM access is reading layout values, and `measure(fn)` covers that.

### State lives in signals

Don't write `this.count = newValue` and update the DOM by hand. Put state in signals, let an effect update the DOM. Setters with equality guards are unnecessary — signals don't notify when value is unchanged.

### Declare child views as fields

So they survive `render()` being called once and cached:

```javascript
class App extends View {
  header = new Header();          // ✓
  todoList = new TodoList();      // ✓

  render() {
    // const header = new Header(); ← ✗ would be re-created if render ran again
    return new Div().append(this.header, this.todoList);
  }
}
```

### Build structure once, react inside effects

`render()` runs once. Build the tree, then wrap reactive bits in `effect()`:

```javascript
render() {
  const root = new Div();
  const text = new Span();

  // Static structure
  root.append(text);

  // Reactive bits
  effect(() => text.setText(String(this.count())));

  return root;
}
```

### Props down via `update()`, events up via `emit()`

Children expose `update(data)` for parents to push state down (used by `List`). Children dispatch events with `emit()` for parents to react. Don't reach into a child's signals or fields from a parent.

## Method reference

### `Node` (base — Element & Fragment both inherit)

| Method | Description |
|---|---|
| `append(...children)` | Append nodes/strings |
| `prepend(...children)` | Prepend nodes/strings |
| `setText(s)` | Replace children with text |
| `setAttribute(name, val)` | Set attribute |
| `removeAttribute(name)` | Remove attribute |
| `toggleAttribute(name, force?)` | Toggle attribute (boolean attrs) |
| `addClass(...)` / `removeClass(...)` | Class manipulation; each arg may be a single class or a space-separated list (`addClass('flex items-center px-4')`) |
| `toggleClass(name, force?)` | Toggle class |
| `setStyle(prop, val)` / `removeStyle(prop)` | Inline style |
| `show()` / `hide()` | Toggle `display` |
| `on(event, handler)` | Add event listener |
| `clear()` | Remove all children |
| `disable()` / `enable()` | Toggle `disabled` attr |
| `mount(container)` | Build DOM and append to container |
| `hydrate(el)` | Adopt existing DOM (from SSR) — bind `el`, attach listeners, recurse into children |
| `toDOM()` / `toString()` | Build DOM / serialize to HTML string |

On `Fragment`, mutation methods (`addClass`, `setAttribute`, ...) broadcast to element children.

### `Element` (additional, beyond Node)

| Method | Description |
|---|---|
| `el` | The `HTMLElement` after mount, else `null` |
| `emit(name, detail?, options?)` | Dispatch a `CustomEvent` (bubbles by default) |
| `focus()` / `blur()` | Native focus control |
| `isFocused()` | Whether `document.activeElement === el` |
| `measure(fn)` | Read layout values: `el.measure(e => e.offsetLeft)` |
| `setHTML(html)` | Set innerHTML (escape hatch) |
| `remove()` | Detach from parent DOM |

### `Input` (additional)

| Method | Description |
|---|---|
| `setValue(s)` / `getValue()` | Text input value |
| `setChecked(b)` / `isChecked()` | Checkbox state |

### `Textarea`, `Select`

| Method | Description |
|---|---|
| `setValue(s)` / `getValue()` | Value |

### Tag subclasses available

Container: `Div`, `Span`, `P`, `Section`, `Article`, `Header`, `Footer`, `Nav`, `Main`, `Aside`
Headings: `H1`, `H2`, `H3`, `H4`, `H5`, `H6`
Lists: `Ul`, `Ol`, `Li`
Tables: `Table`, `Thead`, `Tbody`, `Tr`, `Td`, `Th`
Forms: `Form`, `Input`, `Textarea`, `Label`, `Button`, `Select`, `Option`, `Output`
Inline: `Anchor` (a), `Strong`, `Em`, `Small`, `Code`, `Pre`
Media: `Img`
Void: `Br`, `Hr`

For tags not in this list, use `new Element('section')` style — but prefer the subclass when one exists.

## When creating a new view

1. **Detect file extension**: Check for `tsconfig.json` or existing `.ts` files. Use `.ts` if found, otherwise `.js`.
2. Define class extending `View`.
3. Declare state as `signal(...)`/`computed(...)` fields. Declare child views as fields too.
4. Implement `render()`:
   - Build the static tree with `new Div()`/`new Span()`/etc, chained calls.
   - Append children. Wire events with `.on()`.
   - Wrap reactive bits in `effect()`. One effect can touch multiple nodes.
   - Return the root element.
5. Add event handlers as methods. They typically just write to signals (state) — let effects propagate to the DOM.
6. If the view will be used inside a `List`, implement `update(item)` to write the new item into a signal.
7. **Do not** reach for `this.el` or any element's `.el` property. Use the typed methods.
