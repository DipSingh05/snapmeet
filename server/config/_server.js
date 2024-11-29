import fs from 'node:fs/promises';
import express from 'express';
import { Transform } from 'node:stream';
import cors from 'cors';

export async function createServer() {
  // Extract options with defaults
    const isProduction = process.env.NODE_ENV === 'production';
    const port = process.env.PORT || 5173;
    const base = process.env.BASE || '/';
    const abortDelay = 10000;

  // Cached production assets
  const templateHtml = isProduction
    ? await fs.readFile('./dist/client/index.html', 'utf-8')
    : '';
  const ssrManifest = isProduction
    ? JSON.parse(await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8'))
    : undefined;

  // Create Express app
  const app = express();
  app.use(cors());

  let vite;
  if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: 'true' },
      appType: 'custom',
      base,
    });
    app.use(vite.middlewares);
  } else {
    const compression = (await import('compression')).default;
    const sirv = (await import('sirv')).default;
    app.use(compression());
    app.use(base, sirv('./dist/client', { extensions: [] }));
  }

  // Serve HTML
  app.use('*all', async (req, res) => {
    try {
      const url = req.originalUrl;

      let template;
      let render;
      if (!isProduction) {
        template = await fs.readFile('./index.html', 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render;
      } else {
        template = templateHtml;
        render = (await import('./dist/server/entry-server.js')).render;
      }

      let didError = false;

      const { pipe, abort } = render(url, ssrManifest, {
        onShellError() {
          res.status(500).set({ 'Content-Type': 'text/html' });
          res.send('<h1>Something went wrong</h1>');
        },
        onShellReady() {
          res.status(didError ? 500 : 200).set({ 'Content-Type': 'text/html' });

          const transformStream = new Transform({
            transform(chunk, encoding, callback) {
              res.write(chunk, encoding);
              callback();
            },
          });

          const [htmlStart, htmlEnd] = template.split('<!--app-html-->');
          res.write(htmlStart);

          transformStream.on('finish', () => {
            res.end(htmlEnd);
          });

          pipe(transformStream);
        },
        onError(error) {
          didError = true;
          console.error(error);
        },
      });

      setTimeout(() => {
        abort();
      }, abortDelay);
    } catch (e) {
      vite?.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  // Start server
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });

  return app; // Optionally return the app instance for further configuration or testing
}
