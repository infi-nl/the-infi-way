#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const templateHtml = path.resolve(__dirname, 'src', 'template.html');

(async () => {
  const html = (await fs.readFile(templateHtml)).toString();
  const script = html.split(/<\/?script>/)[1];
  const hash = crypto.createHash('sha256').update(script).digest('base64');
  const updatedHtml = html.replace(/'sha256-.*'/, `'sha256-${hash}'`);
  await fs.writeFile(templateHtml, updatedHtml);
})();
