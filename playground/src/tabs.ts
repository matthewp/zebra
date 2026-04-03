import { View, slot } from '@matthewp/zebra';

interface Tab {
  label: string;
  view: View;
}

export class Tabs extends View {
  activeIndex = 0;
  tabs: Tab[] = [];

  navNode!: HTMLElement;
  indicatorNode!: HTMLElement;
  contentNode!: HTMLElement;

  constructor(tabs: Tab[]) {
    super();
    this.tabs = tabs;
  }

  template() {
    return `<div class="tabs">
      <nav class="tabs-nav">
        ${this.tabs.map((tab, i) =>
          `<button class="tab-btn${i === 0 ? ' active' : ''}" type="button">${tab.label}</button>`
        ).join('')}
        <div class="tabs-indicator"></div>
      </nav>
      <div class="tabs-content">
        ${slot(this.tabs[0].view)}
      </div>
    </div>`;
  }

  mount(el: HTMLElement) {
    super.mount(el);
    this.navNode = el.querySelector('.tabs-nav') as HTMLElement;
    this.indicatorNode = el.querySelector('.tabs-indicator') as HTMLElement;
    this.contentNode = el.querySelector('.tabs-content') as HTMLElement;

    let buttons = this.navNode.querySelectorAll('.tab-btn');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', () => this.onTabClick(i));
    }

    // Mount the initially active tab from existing DOM
    this.tabs[0].view.mount(this.contentNode.firstElementChild as HTMLElement);
    this.positionIndicator(0);
  }

  positionIndicator(index: number) {
    let btn = this.navNode.querySelectorAll('.tab-btn')[index] as HTMLElement;
    this.indicatorNode.style.left = btn.offsetLeft + 'px';
    this.indicatorNode.style.width = btn.offsetWidth + 'px';
  }

  setActiveIndex(value: number) {
    if (this.activeIndex !== value) {
      this.activeIndex = value;

      let buttons = this.navNode.querySelectorAll('.tab-btn');
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle('active', i === value);
      }

      let view = this.tabs[value].view;
      if (!view.el) {
        view.createAndMount();
      }
      this.contentNode.replaceChildren(view.el);
      this.positionIndicator(value);
    }
  }

  onTabClick(index: number) {
    this.setActiveIndex(index);
  }

  update() {
    return this.el;
  }
}

export default Tabs;
