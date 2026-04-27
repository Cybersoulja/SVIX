# CLAUDE.md

This file provides guidance for AI assistants working with this codebase.
For the user-facing project overview and setup instructions, see `README.md`.

## Purpose of this file

CLAUDE.md is for AI assistants. It describes *how to work in this repo* — conventions, entry points, and task guidance. It intentionally avoids duplicating content from `README.md` or restating details that live authoritatively in config files.

## Repository Structure

```
SVIX/
├── index.html              # Main HTML entry point
├── 404.html                # Custom 404 error page
├── css/
│   └── style.css           # Base stylesheet (HTML5 Boilerplate + custom styles)
├── js/
│   ├── app.js              # Main application entry point
│   ├── svix-client.js      # Svix REST API client module
│   └── vendor/             # Third-party JS libraries (committed directly, not npm)
├── img/                    # Image assets
├── favicon.ico / icon.svg / icon.png  # Icons
├── site.webmanifest        # PWA manifest
├── robots.txt              # Crawler rules
├── package.json            # npm scripts and devDependencies
├── webpack.common.js       # Shared Webpack config (entry + output)
├── webpack.config.dev.js   # Dev config (source maps, HMR) — source of truth for dev server
├── webpack.config.prod.js  # Prod config (minification, asset copy) — source of truth for build output
├── .editorconfig           # Formatting rules (indent, charset, line endings)
├── .gitattributes          # Line-ending normalization
└── .gitignore              # node_modules/, dist/, .cache/
```

> **Build system details** (dev server port, output paths, copied assets) live in the webpack config files above. Read those files directly rather than relying on any description here.

## Development Commands

See `package.json` for the canonical script definitions. Quick reference:

```bash
npm install      # Install devDependencies (run once after cloning)
npm start        # Dev server with live reload
npm run build    # Production build → dist/
npm test         # Not yet configured
```

## Code Conventions

Enforced via `.editorconfig`:

- **Indentation**: 2 spaces (no tabs)
- **Encoding**: UTF-8
- **Line endings**: LF (Unix-style)
- **Trailing whitespace**: Always trimmed
- **Final newline**: Required

**File naming**: kebab-case (e.g. `svix-client.js`, `webpack.config.dev.js`).

**JavaScript**: ES modules (`import`/`export`). Vendor libraries that don't support ES modules go in `js/vendor/` and are loaded via `<script>` tags in `index.html`.

## Key Entry Points

- **HTML**: `index.html` — root page and HtmlWebpackPlugin template for production
- **JavaScript**: `js/app.js` — application bootstrap; imports from `js/svix-client.js`
- **API client**: `js/svix-client.js` — `SvixClient` class; all Svix API calls go here
- **Styles**: `css/style.css` — H5BP resets at top, custom styles below the `Author's custom styles` marker

## Testing

No test framework is configured. When adding tests:
- Consider **Vitest** or **Jest**
- Add test files alongside source files or in a `tests/` directory
- Update the `"test"` script in `package.json`

## CI/CD

No pipelines configured. No `.github/workflows/` directory exists.

## Common Tasks for AI Assistants

**Adding a new Svix API method**: Add it to `SvixClient` in `js/svix-client.js`, then call it from `js/app.js`.

**Adding a new UI section**: Add markup to `index.html`, styles to the custom section of `css/style.css`, and wire up DOM logic in `js/app.js`.

**Adding a third-party library via npm**: Install as a `devDependency`. Import in `app.js`; Webpack will bundle it.

**Adding a third-party library without npm**: Place the file in `js/vendor/`, add a `<script>` tag in `index.html` (or `import` it if it supports ES modules).

**Verifying a production build**: Run `npm run build`, then check the `dist/` directory. The exact list of copied assets is defined in `webpack.config.prod.js`.
