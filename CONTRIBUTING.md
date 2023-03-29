# Contribute to The Infi Way?

Thanks for your interest in helping build The Infi Way!
We're always curious for new viewpoints.

Seen something that can be better?
Feel free to [open an issue](https://github.com/infi-nl/the-infi-way/issues/new).
[Pull requests](https://github.com/infi-nl/the-infi-way/pulls) are also welcome.
If you want to run The Infi Way locally, please continue reading.

## 🧑‍💻 Local Development

To develop locally you need:

- A clone of this repository
- [Node.js](https://nodejs.org) 16 (or higher)

In the root you'll find `build.js`, used to build the site.
Usage is as follows:

```shell
./build.js
# Or
node build.js

# To rebuild whenever content or template changes:
./build.js -w
# Or
node build.js -w
```

This script uses `template.html` and the files from the `content` folder to generate a `build` folder with one page per language (one of them default as `index.html`).
This `build` folder also contains all static assets such as the stylesheet.
When the build is done you can open the HTML files in this folder (optionally via a dev server) in your favorite browser, and you're good to go!

The templating is something lightweight and homebrew, inspired by [Handlebars](https://handlebarsjs.com).
This entire engine is part of `build.js`.

Note that while a `package.json` is present, you _don't_ actually need to install NPM dependencies.
It is only necessary to enable the [Lighthouse plugin](https://github.com/netlify/netlify-plugin-lighthouse#readme) for Netlify.
