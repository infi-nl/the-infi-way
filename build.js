#!/usr/bin/env node
const fs = require('fs/promises');
const path = require("path");

const srcDir = path.resolve(__dirname, 'src');
const templateFile = path.resolve(srcDir, 'template.html');
const contentDir = path.resolve(srcDir, 'content');
const resourcesDir = path.resolve(srcDir, 'resources');
const outputDir = path.resolve(__dirname, 'build');
const outputResourcesDir = path.resolve(outputDir, 'resources');

tryBuild();

function tryBuild() {
  return build().catch((e) => console.error(`Build failed! ${e.message}`));
}

async function build() {
  console.log('Starting build...');
  await fs.mkdir(outputDir, {recursive: true});
  const template = (await fs.readFile(templateFile)).toString();
  const processor = new TemplateProcessor();
  const compiledTemplate = processor.compile(template);

  console.log('Loading languages');
  const languages = JSON.parse((await fs.readFile(path.join(contentDir, 'languages.json'))).toString());

  console.log('Processing languages');
  const defaultLanguage = languages.default;
  for (const language of languages.languages) {
    const code = language.code;
    const isDefault = code === defaultLanguage;
    const name = language.name;
    const contentFile = path.join(contentDir, language.contentFile);

    console.log(`  - ${code} ${name}${isDefault ? ' (default)' : ''} from ${contentFile}`);

    const content = {
      ...JSON.parse((await fs.readFile(contentFile)).toString()),
      lang: code,
      languages: languages.languages.map(l => ({
        code: l.code,
        name: l.name,
        href: (l.code === defaultLanguage) ? '/' : `/${l.outPath}`,
        isCurrentLanguage: l.code === code,
      }))
    };

    const processed = processor.process(compiledTemplate, content);
    console.log('    Input processed');

    const languageDir = path.join(outputDir, language.outPath);
    fs.mkdir(languageDir, {recursive: true});
    console.log(`    Writing to ${languageDir}/index.html`);
    await fs.writeFile(path.join(languageDir, 'index.html'), processed);

    if (isDefault) {
      console.log(`    Writing to ${outputDir}/index.html`);
      await fs.writeFile(path.join(outputDir, 'index.html'), processed);
    }
  }

  console.log('Copying resources');
  await fs.mkdir(outputResourcesDir, {recursive: true});
  const resFiles = await fs.readdir(resourcesDir);
  for (const resFile of resFiles) {
    await fs.copyFile(
      path.resolve(resourcesDir, resFile),
      path.resolve(outputResourcesDir, resFile),
    );
  }

  console.log(`Build finished at ${new Date().toLocaleString('en-GB')}`);
}

/**
 * The TemplateProcessor class is a very lightweight templating engine.
 * It's based on the Handlebars syntax.
 *
 * Usage:
 *
 * ```
 * const templateString = 'A {{value}} string';
 * const templateValues = { value: 'template' };
 *
 * const processor = new TemplateProcessor();
 * const compiled = processor.compile(templateString);
 * const result = processor.process(compiled, templateValues);
 *
 * // Result now contains: 'A template string'.
 * ```
 */
class TemplateProcessor {
  static #TOKEN_TYPE_LITERAL = 'literal';
  static #TOKEN_TYPE_REFERENCE = 'reference';
  static #TOKEN_TYPE_FUNC = 'func';

  #funcMapping = {
    each: this.#processFuncEach.bind(this),
    if: this.#processFuncIf.bind(this),
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
      compiled.push({type: TemplateProcessor.#TOKEN_TYPE_LITERAL, value: template.substring(index, tagStartIndex)});

      index = template.indexOf('}}', tagStartIndex) + 2;
      const tag = template.substring(tagStartIndex, index);
      const tagContent = tag.substring(2, tag.length - 2);

      if (tag[2] === '#') {
        // The tag is opening a function block.
        const [name, ...args] = tagContent.substring(1).split(' ');
        if (!this.#funcMapping[name]) {
          throw new Error(`Unknown tag function "${name}"`);
        }

        const subTag = {name, args};
        const [sub, subEndIndex] = this.#doCompile(template, index, subTag);

        index = subEndIndex;
        compiled.push({type: TemplateProcessor.#TOKEN_TYPE_FUNC, tag: subTag, value: sub});
      } else if (tag[2] === '/') {
        // The tag is closing a function block.
        const name = tagContent.substring(1);
        if (!openingTag || name !== openingTag.name) {
          throw new Error(`Closing tag "${name}" does not match opening tag "${openingTag?.name}".`);
        }

        return [compiled, index];
      } else {
        // The tag is a reference.
        compiled.push({type: TemplateProcessor.#TOKEN_TYPE_REFERENCE, value: tagContent});
      }
    }

    if (openingTag) {
      throw new Error(`Unclosed tag: ${openingTag.name}`);
    }

    compiled.push({type: TemplateProcessor.#TOKEN_TYPE_LITERAL, value: template.substring(index)});
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
      return this.#resolveContentReference({this: content}, reference);
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

  #processFuncIf(tag, compiledTemplate, content) {
    // limited to checking a single boolean
    if (!content[tag.args[0]]) {
      return;
    }
    return this.process(compiledTemplate, content);
  }

  static #assertArgLength(tag, expected) {
    if (tag.args.length !== expected) {
      throw new Error(`Expected ${expected} argument(s) for "${tag.name}", but got ${tag.args.length}`);
    }
  }
}
