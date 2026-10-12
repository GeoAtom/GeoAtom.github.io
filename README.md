# GeoAtom.github.io

The GeoAtom website: the company home page and one page per product.
Plain HTML, CSS and JavaScript — no build step, no dependencies.

```
index.html               company home page
homepod-cast/index.html  HomePod Cast product page
assets/site.css          shared styles (light + dark)
assets/site.js           language / theme switches, the interactive demo, room diagrams, latest-release label
assets/img/              icons and HomePod artwork
```

## Preview

```powershell
python -m http.server 4173
```

Then open <http://localhost:4173>. Opening `index.html` straight from disk works too.

## Publish

Push this folder to a repository named `GeoAtom.github.io` in the GeoAtom organization, then enable
**Settings → Pages → Deploy from a branch → `main` / root**. The site appears at <https://geoatom.github.io>.

## Editing

- **Two languages.** Every piece of text exists twice, marked `lang="zh"` and `lang="en"`; `<html data-lang>` shows one.
  The strings inside the demo window live in `assets/site.js` and mirror the app's own (`app.py`).
- **Light and dark.** Colours are the tokens at the top of `site.css`; artwork that differs per theme carries
  `art-light` / `art-dark`.
- **Links.** `?lang=en` or `?lang=zh`, and `?theme=light` or `?theme=dark`, force a language or theme.
- **Version label.** The download buttons always point at the latest GitHub release; the "v1.2.0 · 41 MB" text is a
  fallback that `site.js` replaces with the current release when the GitHub API answers.

## Adding a product

1. Copy `homepod-cast/` to a new folder and rewrite it.
2. Add an `<article class="product">` card to the Products section of `index.html`.
3. Add its icon to the orbit in the hero (replace one of the dashed `.seat` circles with an `.atom` link).

---

HomePod and AirPlay are trademarks of Apple Inc.; Windows is a trademark of Microsoft Corporation.
GeoAtom is not affiliated with Apple or Microsoft.
