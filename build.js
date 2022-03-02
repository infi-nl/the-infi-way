#!/usr/bin/env node
const fs = require('fs/promises');

const templateFile = `${__dirname}/template.html`;
const contentDir = `${__dirname}/content`;
const outputDir = `${__dirname}/build`;

(async () => {
  const template = (await fs.readFile(templateFile)).toString();
  const contentFiles = await fs.readdir(contentDir);
  await fs.mkdir(outputDir, { recursive: true });

  for (const f of contentFiles) {
    const lang = f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf('.'));
    console.log(`Processing language: ${lang}`);
    const content = JSON.parse((await fs.readFile(`${contentDir}/${f}`)).toString());
    content.lang = lang;
    const processed = processTemplate(template, content);
    await fs.writeFile(`${outputDir}/${lang}.html`, processed);
  }

  console.log('Done!');
})();

function processTemplate(template, content) {
  if (typeof content === 'object') {
    return processTemplateObject(template, content);
  }
  if (typeof content === 'string') {
    return processTemplateString(template, content);
  }
  console.error(`Unknown localization content type: ${typeof content}`);
  return template;
}

function processTemplateObject(template, content, prefix = '') {
  let result = template;

  Object.entries(content).forEach(([key, val]) => {
    const fullKey = `${prefix}${key}`;

    if (typeof val === 'string') {
      result = result.replaceAll(`{{${fullKey}}}`, val);
    } else if (Array.isArray(val)) {
      const eachStartToken = `{{#each ${fullKey}}}`;
      const eachEndToken = '{{/each}}';

      let eachStartIndex = result.indexOf(eachStartToken);
      while (eachStartIndex >= 0) {
        const eachEndIndex = result.indexOf(eachEndToken, eachStartIndex + eachStartToken.length);
        const subTemplate = result.substring(eachStartIndex + eachStartToken.length, eachEndIndex);
        const subProcessed = val.map((v) => processTemplate(subTemplate, v)).join('');
        result = spliceString(result, eachStartIndex, eachEndIndex + eachEndToken.length, subProcessed);
        eachStartIndex = result.indexOf(eachStartToken);
      }
    } else if (typeof val === 'object') {
      result = processTemplateObject(result, val, `${fullKey}.`);
    } else {
      console.error(`Unknown localized value: ${val}`);
    }
  });

  return result;
}

function processTemplateString(template, content) {
  return template.replaceAll('{{this}}', content);
}

function spliceString(val, start, end, replacement) {
  return `${val.substring(0, start)}${replacement}${val.substring(end)}`;
}
