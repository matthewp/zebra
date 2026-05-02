import './style.css';
import { App } from './app.ts';

const app = new App();
app.mount(document.querySelector('#app') as HTMLElement);
