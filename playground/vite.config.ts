import { defineConfig, createServerModuleRunner } from 'vite';
import type { Plugin, Connect } from 'vite';

function ssrPlugin(): Plugin {
  return {
    name: 'zebra-ssr',
    configureServer(server) {
      let runner = createServerModuleRunner(server.environments.ssr);

      server.middlewares.use(async (req: Connect.IncomingMessage, res, next) => {
        if (req.url !== '/') return next();

        try {
          let { renderToString } = await runner.import('@matthewp/zebra/server');
          let { App } = await runner.import('/src/app.ts');

          let app = new App();
          let body = renderToString(app);

          let html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Zebra Playground</title>
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;

          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [ssrPlugin()],
});
