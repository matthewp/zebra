---
name: zebra
description: Work with the Zebra framework — a class-based view framework using signals and imperative DOM construction. Use when creating, editing, or refactoring views, components, lists, or UI elements that use Zebra, or when code imports from '@matthewp/zebra'.
---

# Zebra

Zebra is a class-based view framework. Views are plain classes; you build DOM trees by composing typed element wrappers (`Div`, `Span`, `Button`, etc.), wire reactivity with signals and effects, and the same code renders on the server (`toString()`) or the client (`mount()`).

The framework leans into imperative DOM construction. Instead of a template DSL, you call methods like `.append()`, `.addClass()`, `.setText()` to build a tree and `effect(() => ...)` to keep parts of it in sync with signals.

> **Astro projects:** see [astro.md](./astro.md) for the `@matthewp/zebra-astro` integration's authoring conventions.

## Anatomy of a View

```javascript
import { View, Div, Span, Button, signal } from '@matthewp/zebra';

class Counter extends View {
  count = signal(0);

  render() {
    return new Div().addClass('counter').append(
      new Span().setText(this.count),
      new Button().setText('+').on('click', () => this.count(this.count() + 1)),
    );
  }
}
```

Three building blocks:

1. **State fields** declared as `signal(...)`, `computed(...)`, or plain values.
2. **`render()`** builds the element tree, wires events with `.on()`, and returns the root `Element`. Mutation methods accept signals directly; reach for `effect()` when one body must touch multiple nodes.
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

Sitting outside the `Node` tree are `Document`, `Window`, and `DocumentElement` — handles for the global event targets and the `<html>` element, with View-scoped lifetimes. They aren't part of the rendered DOM; see **Global events** below.

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

### Binding signals to the DOM

Mutation methods accept either a static value **or** a zero-arg getter (`Reactive<T>`). Pass a signal directly and the framework wires the effect for you:

```javascript
span.setText(this.count);                       // signal getter
button.toggleClass('active', this.isActive);    // signal getter
link.setAttribute('href', this.url);
content.toggleVisible(this.isVisible);
input.setDisabled(this.busy);
```

Methods that accept `Reactive<T>`:

- `setText(text)`, `setHTML(html)`
- `setAttribute(name, value)`, `toggleAttribute(name, force)`
- `toggleClass(name, force)`
- `setStyle(prop, value)`
- `toggleVisible(visible)` — pairs with `show()`/`hide()`
- `setDisabled(disabled)` — pairs with `disable()`/`enable()`
- `setFocused(focused)` — pairs with `focus()`/`blur()`. Place after visibility bindings in the chain so visibility effects fire first
- `setValue(value)` (Input/Textarea/Select), `setChecked(value)` (Input)

`setText` and `setValue` accept `string | number` — the framework coerces.

For derived values, use `computed`:

```javascript
render() {
  const greeting = computed(() => `Hello, ${this.name()}`);
  return new H1().setText(greeting);
}
```

**Inline `computed` inside `render()` when it's only used to set a DOM value.** Promote it to a class field only when something outside `render()` reads it (event handlers, `toJSON()`, parents, subclasses) — keeping render-local computeds local keeps the class shape focused on actual state.

### Use `effect()` for grouped updates

When several DOM mutations all depend on the **same** signal, write one `effect()` rather than N signal-direct bindings. One effect = one subscription = one notification per change. Three signal-direct bindings on the same signal = three subscriptions and three dispatches.

```javascript
// Good — one effect, one subscription on this.todo
effect(() => {
  const t = this.todo();
  text.setText(t.text);
  checkbox.setChecked(t.done);
  root.toggleClass('completed', t.done);
});

// Bad — three separate effects, three notifications per todo change
text.setText(() => this.todo().text);
checkbox.setChecked(() => this.todo().done);
root.toggleClass('completed', () => this.todo().done);
```

Rule of thumb:

- **Signal-direct** when a binding reads one signal and updates one thing.
- **`effect()`** when several mutations share a signal, or when the body needs intermediate variables.

Effects (and signal-direct bindings) run **immediately** the first time they're set up, so initial state lands without any extra plumbing.

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

For the `<html>` element specifically, use `DocumentElement`. It's an Element-shaped wrapper around `document.documentElement` — full reactive mutation surface (`setAttribute`, `addClass`, `toggleClass`, `setStyle`) plus `.on()` for listeners with the same auto-cleanup story.

```javascript
import { View, Div, DocumentElement, signal } from '@matthewp/zebra';

class App extends View {
  theme = signal<'light' | 'dark'>('light');

  render() {
    new DocumentElement()
      .setAttribute('data-theme', this.theme)
      .toggleClass('reduced-motion', this.prefersReducedMotion);

    return new Div().addClass('app').append(/* ... */);
  }
}
```

Listeners are auto-removed on unmount. **Mutations are not undone** — if you set `data-theme="dark"` on `<html>`, it stays after the view unmounts. App-root views typically never unmount, so this is rarely visible; if you need cleanup, manage it yourself.

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
- All — `isFocused()`, `focus()`, `blur()`, `setFocused(b)`

## Lists

Use `List` for dynamic, keyed children. It does keyed reconciliation — same-key items at the same reference are reused; new keys create views; missing keys destroy them.

```javascript
import { List } from '@matthewp/zebra';

this.list = new List(
  this.items,                              // items source: signal/computed getter or array
  item => item.id,                         // key function
  (item, index) => new ItemView(item, index), // factory: receives item + reactive index
  'ul',                                    // optional: container tag (default 'div')
).addClass('item-list');
```

The factory receives the item value and an `index: () => number` getter that updates when the item moves. The view captures these once at construction.

### How reconciliation handles changes

| Change | Behavior |
|---|---|
| Same key, same item reference | View reused. DOM moved if position changed; index signal updated. |
| Same key, **different reference** | View **destroyed and recreated** via factory. |
| New key | View created via factory and inserted. |
| Key removed | View detached. |

The "different reference → recreate" rule is the key design choice. To get in-place updates without recreation, **put signals inside the item** so its reference stays stable:

```javascript
// Item shape — fields you want to edit in place are signals.
type Todo = {
  id: number;
  text: ReturnType<typeof signal<string>>;
  done: ReturnType<typeof signal<boolean>>;
};

class TodoItem extends View {
  constructor(todo, index) {
    super();
    this.todo = todo;
    this.index = index;
  }

  render() {
    return new Li()
      .toggleClass('completed', this.todo.done)
      .append(
        new Input()
          .setAttribute('type', 'checkbox')
          .setChecked(this.todo.done)
          .on('change', () => this.todo.done(!this.todo.done())),
        new Span().setText(this.todo.text),
      );
  }
}
```

The view passes signal fields directly to mutation methods. When you toggle `done`, the array signal doesn't fire and the reconciler doesn't run; only the affected child's bindings re-run.

### Pitfall: don't replace item references unnecessarily

```javascript
// Bad — spreads create new references for every item.
// Every view in the list will be destroyed and recreated.
this.todos(this.todos().map(t => ({ ...t })));

// Good — toggle the signal in place. Array reference is unchanged,
// reconciler doesn't run, only the affected row's effects fire.
const t = this.todos().find(t => t.id === id);
if (t) t.done(!t.done());
```

If your item shape is intentionally immutable (no nested signals), then the only way to "edit" is to replace the reference — and yes, that recreates the view. That's the correct behavior for items modeled as values.

### Reactive index

The factory's second argument is `() => number` — a signal-shaped getter that updates when the item moves:

```javascript
class StripedRow extends View {
  constructor(item, index) {
    super();
    this.item = item;
    this.index = index;
  }

  render() {
    return new Tr()
      .toggleClass('odd', () => this.index() % 2 === 1)
      .append(new Td().setText(() => `${this.index() + 1}.`));
  }
}
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
| Focus reactively | `el.setFocused(signal)` |
| Read layout (offsetLeft, etc.) | `el.measure(e => e.offsetLeft)` |
| Dispatch event | `el.emit('name', detail)` |
| Set innerHTML | `el.setHTML(html)` |
| Empty children | `el.clear()` |
| Detach from DOM | `el.remove()` |

The only legitimate raw-DOM access is reading layout values, and `measure(fn)` covers that.

Two patterns beyond single-value reads:

**Hit-testing multiple views** — iterate views and `measure` each:

```ts
findColumnAt(x, y) {
  for (const col of this.columns) {
    const hit = col.measure(el => {
      const r = el.getBoundingClientRect();
      return x >= r.left && x < r.right && y >= r.top && y < r.bottom;
    });
    if (hit) return col;
  }
}
```

**Send a View through an event detail** — when the receiver needs to measure the emitter, pass the View itself; don't fish through `e.target`:

```ts
// emitter
this.emit('grab', { view: this, ... });

// receiver
const { view } = e.detail;
const rect = view.measure(el => el.getBoundingClientRect());
```

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
  const text = new Span().setText(this.count);
  return new Div().append(text);
}
```

### Props down via constructor, events up via `emit()`

Pass everything a child needs — values, signals, getters — through its constructor. Children dispatch events with `emit()` for parents to react. Don't reach into a child's signals or fields from a parent.

## Method reference

### `Node` (base — Element & Fragment both inherit)

| Method | Description |
|---|---|
| `append(...children)` | Append nodes/strings |
| `prepend(...children)` | Prepend nodes/strings |
| `setText(s)` | Replace children with text. `s` is `Reactive<string \| number>` |
| `setAttribute(name, val)` | Set attribute. `val` is `Reactive<string>` |
| `removeAttribute(name)` | Remove attribute |
| `toggleAttribute(name, force?)` | Toggle attribute (boolean attrs). `force` is `Reactive<boolean>` |
| `addClass(...)` / `removeClass(...)` | Class manipulation; each arg may be a single class or a space-separated list (`addClass('flex items-center px-4')`) |
| `toggleClass(name, force?)` | Toggle class. `force` is `Reactive<boolean>` |
| `setStyle(prop, val)` / `removeStyle(prop)` | Inline style. `val` is `Reactive<string>` |
| `show()` / `hide()` | Toggle `display` |
| `toggleVisible(visible)` | Show or hide. `visible` is `Reactive<boolean>` |
| `setDisabled(disabled)` | Toggle `disabled` attr. `disabled` is `Reactive<boolean>` |
| `on(event, handler)` | Add event listener |
| `clear()` | Remove all children |
| `disable()` / `enable()` | Toggle `disabled` attr |
| `mount(container)` | Build DOM and append to container |
| `hydrate(el)` | Adopt existing DOM (from SSR) — bind `el`, attach listeners, recurse into children |
| `toDOM()` / `toString()` | Build DOM / serialize to HTML string |

`Reactive<T>` means either a static value or a zero-arg getter (signal/computed/closure). Pass a getter to bind reactively without writing an explicit `effect()`.

On `Fragment`, mutation methods (`addClass`, `setAttribute`, ...) broadcast to element children.

### `Element` (additional, beyond Node)

| Method | Description |
|---|---|
| `el` | The `HTMLElement` after mount, else `null` |
| `emit(name, detail?, options?)` | Dispatch a `CustomEvent` (bubbles by default) |
| `focus()` / `blur()` | Native focus control |
| `isFocused()` | Whether `document.activeElement === el` |
| `setFocused(b)` | Reactively focus or blur. `b` is `Reactive<boolean>`. Set visibility before focus in your chain — visibility effects fire in subscription order, so `.toggleAttribute('hidden', ...).setFocused(open)` is the correct pattern |
| `measure(fn)` | Read layout values: `el.measure(e => e.offsetLeft)` |
| `setHTML(html)` | Set innerHTML (escape hatch). `html` is `Reactive<string>` |
| `remove()` | Detach from parent DOM |

### `Input` (additional)

| Method | Description |
|---|---|
| `setValue(s)` / `getValue()` | Text input value. `s` is `Reactive<string \| number>` |
| `setChecked(b)` / `isChecked()` | Checkbox state. `b` is `Reactive<boolean>` |

### `Textarea`, `Select`

| Method | Description |
|---|---|
| `setValue(s)` / `getValue()` | Value. `s` is `Reactive<string \| number>` |

### Globals

| Class | Description |
|---|---|
| `Document` | View-scoped wrapper for `document`. Use `.on(event, handler)` for global listeners |
| `Window` | View-scoped wrapper for `window`. Use `.on(event, handler)` for global listeners |
| `DocumentElement` | Element-shaped wrapper for `<html>`. Full reactive mutation surface (`setAttribute`, `addClass`, `toggleClass`, `setStyle`) plus `.on()`. Listeners auto-clean on view unmount; mutations are not undone |

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
3. Declare signals as fields. Promote a `computed` to a field only when it's read outside `render()` (event handlers, `toJSON()`, parents, subclasses). Declare child views as fields too.
4. Implement `render()`:
   - Build the static tree with `new Div()`/`new Span()`/etc, chained calls.
   - Append children. Wire events with `.on()`.
   - For single-field reactive bindings, pass the signal directly to mutation methods (`setText(this.count)`).
   - For derived values used only to set DOM, declare a `const fullName = computed(...)` inside `render()` and pass it to the mutation method.
   - For grouped updates that share a signal, write one `effect()` that touches multiple nodes.
   - Return the root element.
5. Add event handlers as methods. They typically just write to signals (state) — let effects propagate to the DOM.
6. If the view will be used inside a `List`, accept `(item, index)` in the constructor. Item fields you want to edit in place should be signals on the item itself — see the **Lists** section.
7. **Do not** reach for `this.el` or any element's `.el` property. Use the typed methods.
