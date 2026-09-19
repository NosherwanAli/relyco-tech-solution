import { defineConfig } from 'vite';
import { resolve } from 'path';

// Extensionless page routes (e.g. "/solution") aren't resolved to their
// "<route>/index.html" file by Vite's dev or preview server on their own -
// only "/solution/" (trailing slash) or the literal .html path are. This
// redirects the clean URL to its trailing-slash form so it resolves in both.
function cleanUrlRedirect(routes) {
  const middleware = (req, res, next) => {
    if (routes.includes(req.url)) {
      res.writeHead(302, { Location: `${req.url}/` });
      res.end();
      return;
    }
    next();
  };

  return {
    name: 'clean-url-redirect',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

// Multi-page app: each key becomes its own bundle, and each HTML file's own
// folder gives it a clean URL (e.g. /solution/ -> solution/index.html) that
// works identically in `vite dev`, `vite build` + `vite preview`.
export default defineConfig({
  root: '.',
  publicDir: 'public',
  appType: 'mpa',
  plugins: [cleanUrlRedirect(['/solution'])],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        solution: resolve(__dirname, 'solution/index.html'),
      },
    },
  },
});
