import './style.css';
import { App } from './app.ts';

let app = new App();
let existing = document.querySelector('#app > .app') as HTMLElement | null;
if (existing) {
  app.mount(existing);
} else {
  app.createAndMount();
  document.querySelector('#app')!.append(app.el);
}
