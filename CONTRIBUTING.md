# Contribute to The Infi Way?

Thank you for your interest in helping build The Infi Way!
We're always curious for new viewpoints.

Seen something that can be better?
Feel free to [open an issue](https://github.com/infi-nl/the-infi-way/issues/new).
[Pull requests](https://github.com/infi-nl/the-infi-way/pulls) are also welcome.
If you want to run The Infi Way locally, please continue reading.

To begin development, first fork the repository. This creates a copy to your personal github account, to which you can push your changes. When finished, you can create a pull request(PR) to the main repository.
For more information on how to create a PR, see [github's official documentation for creating pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork).

It is important to contain your changes to 1 (one) PR per issue. This keeps the code easy to review and allows people to work on seperate parts of the Infi Way seperately.

It is possible to add a second Remote repository to your project: this is useful for when you need to pull the latest changes from the main repository but need to push changes to your personal one.
You can use the following command:
```shell
git remote add <name> <url>
```

This way you can access the repo under the given name like this:
```shell
#example
git fetch <name>
```

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
npm start
```

This script uses `template.html` and the files from the `content` folder to generate a `build` folder with one page per language (one of them default as `index.html`).
This `build` folder also contains all static assets such as the stylesheet.
When the build is done you can open the HTML files in this folder (optionally via a dev server) in your favorite browser, and you're good to go!

The templating is something lightweight and homebrew, inspired by [Handlebars](https://handlebarsjs.com).
This entire engine is part of `build.js`.

Note that while a `package.json` is present, you _don't_ actually need to install NPM dependencies.
It is only necessary to enable the [Lighthouse plugin](https://github.com/netlify/netlify-plugin-lighthouse#readme) for Netlify.

