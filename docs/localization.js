window.addEventListener('DOMContentLoaded', () => {
  const searchParams = new URLSearchParams(window.location.search);
  const langTag = searchParams.get('lang') === 'en' ? 'en' : 'nl';
  const content = JSON.parse(document.getElementById('content').textContent)[langTag];
  const body = document.getElementsByTagName('body')[0];
  body.innerHTML = processL10n(body.innerHTML, content);
});

function processL10n(template, content) {
  if (typeof content === 'object') {
    return processL10nObject(template, content)
  }
  if (typeof content === 'string') {
    return processL10nString(template, content);
  }
  console.error(`Unknown localization content type: ${typeof content}`)
  return template;
}

function processL10nObject(template, content, prefix = '') {
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
        const subProcessed = val.map((v) => processL10n(subTemplate, v)).join('');
        result = spliceString(result, eachStartIndex, eachEndIndex + eachEndToken.length, subProcessed);
        eachStartIndex = result.indexOf(eachStartToken);
      }
    } else if (typeof val === 'object') {
      result = processL10nObject(result, val, `${fullKey}.`);
    } else {
      console.error(`Unknown localized value: ${val}`);
    }
  });

  return result;
}

function processL10nString(template, content) {
  return template.replaceAll('{{this}}', content);
}

function spliceString(val, start, end, replacement) {
  return `${val.substring(0, start)}${replacement}${val.substring(end)}`;
}
