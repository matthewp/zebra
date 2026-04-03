import { renderToString } from '@matthewp/zebra/server';
import { App } from './src/app.ts';

let app = new App();
let html = renderToString(app);

console.log(html);
