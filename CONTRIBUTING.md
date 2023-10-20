# Contribute to The Infi Way?

Thank you for your interest in helping build The Infi Way!
We're always curious for new viewpoints.

Seen something that can be better?
Feel free to [open an issue](https://github.com/infi-nl/the-infi-way/issues/new).
[Pull requests](https://github.com/infi-nl/the-infi-way/pulls) are also welcome.
If you want to run The Infi Way locally, please continue reading.

To begin development, first [fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) this repository. This creates a copy of the repository in your personal Github account that allows you to create branches and push commits. Create a feature branch with an applicable name (`improve-feature-x` or `fix-bug-y`) and commit & push your changes to it. When finished, you can create a [PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) from your fork's feature branch to the `main` branch of the [original repository](https://github.com/infi-nl/the-infi-way).

It is important to contain your changes to 1 (one) PR per issue. This keeps the code easy to review and allows people to work on separate parts of the Infi Way separately.

## 🧑‍💻 Local Development

To develop locally you need:

- A clone of this repository
- [Node.js](https://nodejs.org) 16 (or higher)

In the root you'll find `build.js`, used to build the site.
Usage is as follows:

```shell
# Install packages
npm install

./build.js
# Or
node build.js

# To rebuild whenever content or template changes:
npm start
```
The packages included are used to host the web page locally and make the http server respond to changes. In `package.json` you can see what files are being watched. You may have to reload the page for the changes to take effect.

This script uses `src/template.html` and the files from the `src/content` folder to generate a `build` folder with one page per language (one of them default as `index.html`).
All resources (images and svg files) can be found in the `src/resources` directory.
When the build is done you can open the HTML files in the `build` folder (optionally via a dev server) in your favorite browser, and you're good to go!

The templating is something lightweight and homebrew, inspired by [Handlebars](https://handlebarsjs.com).
This entire engine is part of `build.js`.

Some functionality is set up using an inline `script` tag in `src/template.html`.
Whenever this changes, the script hash in the content security policy also needs to be updated.
This can be done automatically using the `generate-csp.js` script.
