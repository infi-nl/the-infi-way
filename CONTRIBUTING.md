# Contribute to The Infi Way?

Thank you for your interest in helping build The Infi Way!
We're always curious for new viewpoints.

Seen something that can be better?
Feel free to [open an issue](https://github.com/infi-nl/the-infi-way/issues/new).
[Pull requests](https://github.com/infi-nl/the-infi-way/pulls) are also welcome.
If you want to run The Infi Way locally, please continue reading.

To begin development, first [fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) this repository. This creates a copy of the repository in your personal Github account that allows you to create branches and push commits. Create a feature branch with an applicable name (`improve-feature-x` or `fix-bug-y`) and commit & push your changes to it. When finished, you can create a [PR](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) from your fork's feature branch to the `main` branch of the [original repository](https://github.com/infi-nl/the-infi-way).

It is important to contain your changes to 1 (one) PR per issue. This keeps the code easy to review and allows people to work on separate parts of the Infi Way separately.

## 🧑‍💻 Building and developing

To develop locally you need:

- A clone of this repository
- [Node.js](https://nodejs.org)

There are purposely no dependencies (dev or runtime) in our `package.json`, at the cost of some hand-crafted build tooling.
Less stuff to manage and keep up to date.

The scripts use `src/template.html` and the files from the `src/content` folder to generate a `build` folder with one page per language (one of them default as `index.html`).
All resources (images and svg files) can be found in the `src/resources` directory.


### Making a build

Run this to just build output into the the `./build` folder:

```shell
npm run build
```

### Local development

Run this to serve on localhost:8080, (re)building when watched files change:

```shell
npm run start
```
