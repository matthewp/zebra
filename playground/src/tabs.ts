import { View, Div, Nav, Button, signal, effect, type Element } from '@matthewp/zebra';

interface Tab {
  label: string;
  view: View;
}

export class Tabs extends View {
  activeIndex = signal(0);
  tabs: Tab[];

  private buttons: Button[] = [];
  private indicator: Div | null = null;

  constructor(tabs: Tab[]) {
    super();
    this.tabs = tabs;
  }

  render(): Element {
    const root = new Div().addClass('tabs');
    const nav = new Nav().addClass('tabs-nav');
    const indicator = new Div().addClass('tabs-indicator');
    const content = new Div().addClass('tabs-content');

    this.indicator = indicator;

    this.buttons = this.tabs.map((tab, i) => {
      const btn = new Button().addClass('tab-btn').setAttribute('type', 'button').setText(tab.label);
      btn.on('click', () => this.activeIndex(i));
      nav.append(btn);
      return btn;
    });
    nav.append(indicator);

    effect(() => {
      const idx = this.activeIndex();
      for (let i = 0; i < this.buttons.length; i++) {
        this.buttons[i].toggleClass('active', i === idx);
      }
      content.clear().append(this.tabs[idx].view);
      this.positionIndicator(idx);
    });

    root.append(nav, content);
    return root;
  }

  mount(container: HTMLElement): this {
    super.mount(container);
    this.positionIndicator(this.activeIndex());
    return this;
  }

  private positionIndicator(index: number) {
    const btn = this.buttons[index];
    const m = btn?.measure(el => ({ left: el.offsetLeft, width: el.offsetWidth }));
    if (!m || !this.indicator) return;
    this.indicator
      .setStyle('left', m.left + 'px')
      .setStyle('width', m.width + 'px');
  }
}

export default Tabs;
