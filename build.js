#!/usr/bin/env node
const fs = require('fs/promises');

const templateFile = `${__dirname}/template.html`;
const contentDir = `${__dirname}/content`;
const outputDir = `${__dirname}/build`;

(async () => {
  const template = (await fs.readFile(templateFile)).toString();
  const contentFiles = await fs.readdir(contentDir);
  await fs.mkdir(outputDir, { recursive: true });

  const processor = new TemplateProcessor();
  const compiledTemplate = processor.compile(template);

  for (const f of contentFiles) {
    const lang = f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf('.'));
    console.log(`Processing language: ${lang}`);
    const content = JSON.parse((await fs.readFile(`${contentDir}/${f}`)).toString());
    content.lang = lang;
    const processed = processor.process(compiledTemplate, content);
    await fs.writeFile(`${outputDir}/${lang}.html`, processed);
  }

  console.log('Done!');
})();

class TemplateProcessor {
  #funcMapping = {
    each: this.#processFuncEach.bind(this),
  };

  /**
   * Compile a template into tokens.
   *
   * An example of the tokens:
   *
   * ```
   *[
   *  {
   *    type: 'literal',
   *    value: 'a literal string value'
   *  },
   *  {
   *    type: 'value',
   *    value: 'content.object.value'
   *  },
   *  {
   *    type: 'func',
   *    tag: {
   *      name: 'each',
   *      args: [ 'list' ]
   *    },
   *    value: [
   *      {
   *        type: 'value',
   *        value: 'this'
   *      }
   *    ]
   *  }
   *]
   * ```
   *
   * @param {string} template
   */
  compile(template) {
    return this.#doCompile(template, 0)[0];
  }

  #doCompile(template, startIndex, openingTag) {
    const compiled = [];

    let index = startIndex;
    let tagStartIndex = -1;
    while ((tagStartIndex = template.indexOf('{{', index)) >= 0) {
      compiled.push({ type: 'literal', value: template.substring(index, tagStartIndex) });

      index = template.indexOf('}}', tagStartIndex) + 2;
      const tag = template.substring(tagStartIndex, index);
      const tagContent = tag.substring(2, tag.length - 2);

      if (tag[2] === '#') {
        // The tag is opening a function block.
        const [name, ...args] = tagContent.substring(1).split(' ');
        if (!this.#funcMapping[name]) {
          throw new Error(`Unknown tag function "${name}"`);
        }

        const subTag = { name, args };
        const [sub, subEndIndex] = this.#doCompile(template, index, subTag);

        index = subEndIndex;
        compiled.push({ type: 'func', tag: subTag, value: sub });
      } else if (tag[2] === '/') {
        // The tag is closing a function block.
        const name = tagContent.substring(1);
        if (!openingTag || name !== openingTag.name) {
          throw new Error(`Closing tag "${name}" does not match opening tag "${openingTag?.name}".`);
        }

        return [compiled, index];
      } else {
        // The tag is a value.
        compiled.push({ type: 'value', value: tagContent });
      }
    }

    if (openingTag) {
      throw new Error(`Unclosed tag: ${openingTag.name}`);
    }

    compiled.push({ type: 'literal', value: template.substring(index) });
    return [compiled];
  }

  process(compiledTemplate, content) {
    return compiledTemplate
      .map((token) => {
        switch (token.type) {
          case 'literal':
            return token.value;
          case 'value':
            const contentValue = this.#getContentValue(content, token.value);
            if (contentValue === undefined) {
              throw new Error(`Undefined value: ${token.value}`);
            }
            return contentValue;
          case 'func':
            return this.#funcMapping[token.tag.name](token.tag, token.value, content);
          default:
            throw new Error(`Unknown token type: ${token.type}`);
        }
      })
      .join('');
  }

  /**
   * @param {Object} content
   * @param {string} valuePath
   */
  #getContentValue(content, valuePath) {
    if (typeof content === 'string' && valuePath === 'this') {
      return content;
    }

    if (valuePath.includes('.')) {
      const [first, ...rest] = valuePath.split('.');
      return this.#getContentValue(content[first], rest.join('.'));
    }

    return content[valuePath];
  }

  #processFuncEach(tag, compiledTemplate, content) {
    TemplateProcessor.#assertArgLength(tag, 1);
    const list = this.#getContentValue(content, tag.args[0]);

    if (!Array.isArray(list)) {
      throw new Error(`Argument "${tag.args[0]}" for "${tag.name}" must be a list, ${typeof list} given`);
    }

    return list.map((item) => this.process(compiledTemplate, item)).join('');
  }

  static #assertArgLength(tag, expected) {
    if (tag.args.length !== expected) {
      throw new Error(`Expected ${expected} argument(s) for "${tag.name}", but got ${tag.args.length}`);
    }
  }
}
