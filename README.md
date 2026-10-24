# Did You Know? Random Facts

A calm little corner of the internet for surprising, checkable facts. This is a free static site built with plain HTML, CSS and JavaScript, so it can run on GitHub Pages without a build step or server.

## Included

The site includes a random fact home page, a daily fact, topic browsing, category pages, client-side search, saved facts stored in the browser, copy and share actions, light and dark themes, responsive layout, keyboard-friendly controls, reduced-motion support and launch-ready metadata.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell, metadata, navigation and footer |
| `style.css` | Responsive visual system and light/dark themes |
| `app.js` | Hash routing, random facts, search, saving and sharing |
| `facts.js` | All fact and category content |
| `manus-routes.json` | Static route manifest for preview tooling |
| `.nojekyll` | Lets GitHub Pages serve files as-is |

## Publish on GitHub Pages

Create a public repository on GitHub, upload every file in this folder, and commit to the `main` branch. In the repository, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and the root folder, then save. GitHub will show the live URL after the Pages deployment finishes.

For a user site, name the repository `YOUR-USERNAME.github.io` to publish at `https://YOUR-USERNAME.github.io/`. For a project site named `random-facts`, the URL is usually `https://YOUR-USERNAME.github.io/random-facts/`.

## Add facts

Open `facts.js` and append a new object inside `window.FACTS`:

```js
{ c: "science", t: "Your new fact here." },
```

The category ID must match one of the entries in `window.CATEGORIES`. Add new facts at the end of the list so saved-fact positions remain stable for existing visitors.

## Test locally

Run `python3 -m http.server 3000` in this folder and open `http://localhost:3000`.
