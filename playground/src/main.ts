import './style.css';
import { App } from './app.ts';

const app = new App();
const container = document.querySelector('#app') as HTMLElement;
const existing = container.firstElementChild as HTMLElement | null;

if (existing) {
  app.hydrate(existing);
} else {
  app.appendTo(container);
}
