# Zebra

A class-based view framework for building web UIs with signals and imperative DOM construction. Views are plain classes; you build the DOM by composing element wrappers (`Div`, `Span`, etc.), wire reactivity with signals and effects, and ship to client or server with the same code.

## Start with your AI agent

Paste this into Claude Code (or any agent that supports skills):

```text
Run `npx skills add matthewp/zebra`, load the zebra skill, and ask me what I want to build.
```

The agent installs the Zebra skill, learns the framework's conventions, then walks you through your first view.

## Counter example

```js
import { View, Div, Span, Button, signal, effect } from '@matthewp/zebra';

class Counter extends View {
  count = signal(0);

  render() {
    const root = new Div().addClass('counter');
    const span = new Span();
    const inc = new Button().setText('+').on('click', () => this.count(this.count() + 1));

    effect(() => span.setText(String(this.count())));

    root.append(span, inc);
    return root;
  }
}

new Counter().mount(document.querySelector('#app'));
```

## Why Zebra

- **No template DSL.** Views are plain classes. `render()` builds DOM with element wrappers and returns the root.
- **Signals, not virtual DOM.** Reactivity flows through [alien-signals](https://github.com/stackblitz/alien-signals); effects update only the nodes that depend on a changed signal.
- **Same code, server or client.** `view.toString()` produces HTML strings without touching a DOM. `view.mount(el)` builds and attaches real DOM.
- **Typed DOM access.** Reach for `getValue()`, `setChecked()`, `isFocused()`, `measure()` — `view.el` is rarely needed.

## Manual install

```bash
npm install @matthewp/zebra
```

## Concepts

- **`Element`** wraps a tag (`Div`, `Span`, `Button`, ...). Build a tree with `.append()`, style it with `.addClass()` / `.setStyle()`, attach handlers with `.on()`.
- **`View`** is a component class. Override `render()` to return an `Element`. Mount with `view.mount(domEl)` or embed inside another view's render via `parent.append(view)`.
- **`signal(v)`** holds reactive state. `count()` reads, `count(v)` writes.
- **`effect(fn)`** re-runs `fn` whenever any signal it read changes — used to update the DOM from state.
- **`List`** (`@matthewp/zebra/list`) handles dynamic lists with keyed reconciliation; takes a signal of items, a key fn, and a factory.
- **`Fragment`** groups multiple siblings without a wrapper tag.

## Skill

The [Zebra skill](skills/zebra/SKILL.md) teaches an agent the framework's conventions. The "Start with your AI agent" snippet above installs it; you can also add it directly:

```bash
npx skills add matthewp/zebra
```
