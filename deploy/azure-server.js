const http = require('node:http');

const port = process.env.PORT || process.env.HTTP_PLATFORM_PORT || 4000;

import('./server/server.mjs')
  .then(({ reqHandler }) => {
    http.createServer((req, res) => reqHandler(req, res)).listen(port, () => {
      console.log(`Angular SSR server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start Angular SSR server.', error);
    process.exit(1);
  });
