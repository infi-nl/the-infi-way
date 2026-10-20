const fs = require('fs/promises');
const path = require('path');
const http = require('http');

const servePort = 8080;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

// Tiny home-brew dev server to prevent needing external devDependency entries.
function serve(outputDir) {
  http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = path.join(outputDir, urlPath);
    if (filePath !== outputDir && !filePath.startsWith(outputDir + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    try {
      if ((await fs.stat(filePath)).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      const body = await fs.readFile(filePath);
      const contentType = contentTypes[path.extname(filePath)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' }).end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  }).listen(servePort, () => console.log(`Serving ${outputDir} at http://localhost:${servePort}`));
}

module.exports = { serve };
