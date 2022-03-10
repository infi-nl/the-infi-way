#!/usr/bin/env node
const fs = require('fs/promises');

const templateFile = `${__dirname}/template.html`;
const contentDir = `${__dirname}/content`;
const outputDir = `${__dirname}/build`;

const cliHelpText = `
Usage: ./build.js [options]

Options:
  -h, --help      Print the help and usage info (this text).
  -w, --watch     Watch the template and content files for changes.
`.trim();

(async () => {
  const [, , ...args] = process.argv;

  for (const arg of args) {
    switch (arg) {
      case '-h':
      case '--help':
        console.log(cliHelpText);
        return;
      case '-w':
      case '--watch':
        await buildWatch();
        return;
      default:
        console.error(`Unknown option: ${arg}`);
        console.log(cliHelpText);
        process.exit(1);
        return;
    }
  }

  await build();
})();

async function buildWatch() {
  console.clear();
  console.log('Starting build in watch mode.');
  await tryBuild();
  startWatchAndBuild(templateFile);
  startWatchAndBuild(contentDir);
}

async function startWatchAndBuild(file) {
  const watcher = fs.watch(file, { recursive: true });
  for await (const _ of watcher) {
    console.clear();
    console.log(`Last build time: ${new Date().toLocaleString('en-GB')}`);
    await tryBuild();
  }
}

function tryBuild() {
  return build().catch((e) => console.error(e));
}

async function build() {
  console.log('Starting build...');
  const template = (await fs.readFile(templateFile)).toString();
  const contentFiles = await fs.readdir(contentDir);

  const processor = new TemplateProcessor();
  const compiledTemplate = processor.compile(template);

  console.log('Processing language:');
  for (const f of contentFiles) {
    const lang = f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf('.'));
    console.log(`  - ${lang}`);
    const content = JSON.parse((await fs.readFile(`${contentDir}/${f}`)).toString());
    content.lang = lang;
    const processed = processor.process(compiledTemplate, content);
    await fs.writeFile(`${outputDir}/${lang}.html`, processed);
  }

  console.log('Done!');
}

class TemplateProcessor {
  static #TOKEN_TYPE_LITERAL = 'literal';
  static #TOKEN_TYPE_REFERENCE = 'reference';
  static #TOKEN_TYPE_FUNC = 'func';

  #funcMapping = {
    each: this.#processFuncEach.bind(this),
  };

  /**
   * Compile a template into a list of tokens.
   *
   * A token is an object with a type (one of the static `TOKEN_TYPE`s) and additional information.
   *
   * A literal token contains just a string value which will be used verbatim:
   *
   * ```
   * {
   *   type: 'literal',
   *   value: 'A literal string value.'
   * }
   * ```
   *
   * A reference token contains a reference to a value from the content, which will be replaced:
   *
   * ```
   * {
   *   type: 'reference',
   *   value: 'value.from.content'
   * }
   * ```
   *
   * A func token contains the tag name and arguments, and the body, which is a list of tokens:
   *
   * ```
   * {
   *   type: 'func',
   *   tag: {
   *     name: 'each',
   *     args: [ 'list' ]
   *   },
   *   value: [
   *     {
   *       type: 'reference',
   *       value: 'this'
   *     }
   *   ]
   * }
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
      compiled.push({ type: TemplateProcessor.#TOKEN_TYPE_LITERAL, value: template.substring(index, tagStartIndex) });

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
        compiled.push({ type: TemplateProcessor.#TOKEN_TYPE_FUNC, tag: subTag, value: sub });
      } else if (tag[2] === '/') {
        // The tag is closing a function block.
        const name = tagContent.substring(1);
        if (!openingTag || name !== openingTag.name) {
          throw new Error(`Closing tag "${name}" does not match opening tag "${openingTag?.name}".`);
        }

        return [compiled, index];
      } else {
        // The tag is a reference.
        compiled.push({ type: TemplateProcessor.#TOKEN_TYPE_REFERENCE, value: tagContent });
      }
    }

    if (openingTag) {
      throw new Error(`Unclosed tag: ${openingTag.name}`);
    }

    compiled.push({ type: TemplateProcessor.#TOKEN_TYPE_LITERAL, value: template.substring(index) });
    return [compiled];
  }

  /**
   * Process a template, replacing all template tags with the content.
   *
   * @param compiledTemplate The compiled template, as returned by {@link compile}.
   * @param content The template content.
   * @return {string}
   */
  process(compiledTemplate, content) {
    return compiledTemplate
      .map((token) => {
        switch (token.type) {
          case TemplateProcessor.#TOKEN_TYPE_LITERAL:
            return token.value;
          case TemplateProcessor.#TOKEN_TYPE_REFERENCE:
            const contentValue = this.#resolveContentReference(content, token.value);
            if (contentValue === undefined) {
              throw new Error(`Undefined content reference: ${token.value}`);
            }
            return contentValue;
          case TemplateProcessor.#TOKEN_TYPE_FUNC:
            return this.#funcMapping[token.tag.name](token.tag, token.value, content);
          default:
            throw new Error(`Unknown token type: ${token.type}`);
        }
      })
      .join('');
  }

  /**
   * Get a value from the content by a reference.
   *
   * If the content is an object, the reference can be a dot-separated path.
   *
   * If the content is a string, the reference can only be 'this'.
   *
   * @param {Object|string} content
   * @param {string} reference
   */
  #resolveContentReference(content, reference) {
    if (typeof content === 'string') {
      return this.#resolveContentReference({ this: content }, reference);
    }

    if (reference.includes('.')) {
      const [first, ...rest] = reference.split('.');
      return this.#resolveContentReference(content[first], rest.join('.'));
    }

    return content[reference];
  }

  #processFuncEach(tag, compiledTemplate, content) {
    TemplateProcessor.#assertArgLength(tag, 1);
    const list = this.#resolveContentReference(content, tag.args[0]);

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
