# CLAUDE.md

This file provides guidance for AI assistants working with this codebase.

## Project Overview

This is a static frontend web application built on **HTML5 Boilerplate**, configured with **Webpack 5** for asset bundling and a development server. The project is in early-stage development (v0.0.1) and uses vanilla HTML, CSS, and JavaScript — no UI framework.

The README references the [Svix](https://www.svix.com/) webhook API, suggesting this project is intended to integrate with or demonstrate Svix webhook functionality.

## Repository Structure

```
SVIX/
├── index.html              # Main HTML entry point (HTML5 Boilerplate template)
├── 404.html                # Custom 404 error page
├── css/
│   └── style.css           # Base stylesheet (HTML5 Boilerplate styles)
├── js/
│   ├── app.js              # Main JavaScript entry point (currently empty)
│   └── vendor/             # Third-party JS libraries (committed directly)
├── img/                    # Image assets
├── favicon.ico             # Favicon (ICO format)
├── icon.svg                # SVG icon
├── icon.png                # PNG icon (192x192, for Apple touch)
├── site.webmanifest        # PWA web app manifest
├── robots.txt              # Search engine crawler rules
├── package.json            # Node.js project metadata and npm scripts
├── webpack.common.js       # Shared Webpack configuration
├── webpack.config.dev.js   # Development Webpack config (dev server + source maps)
├── webpack.config.prod.js  # Production Webpack config (minification + asset copy)
├── .editorconfig           # Editor formatting rules
├── .gitattributes          # Git line-ending normalization rules
├── .gitignore              # Ignores: node_modules/, dist/, .cache/
└── LICENSE.txt             # MIT License (from HTML5 Boilerplate)
```

## Development Commands

```bash
# Install dependencies (required once after cloning)
npm install

# Start development server (opens browser automatically, hot reload enabled)
npm start

# Build for production (outputs to dist/)
npm run build

# Tests (not yet configured — exits with error)
npm test
```

## Build System

**Bundler**: Webpack 5

The Webpack config is split into three files:

| File | Purpose |
|------|---------|
| `webpack.common.js` | Shared: entry point `./js/app.js`, output to `dist/js/app.js` |
| `webpack.config.dev.js` | Development: inline source maps, live reload, HMR, static files served from `./` |
| `webpack.config.prod.js` | Production: minification, HtmlWebpackPlugin, CopyPlugin for static assets |

**Build output**: `dist/` directory (gitignored). Production build copies:
- `img/` → `dist/img/`
- `css/` → `dist/css/`
- `js/vendor/` → `dist/js/vendor/`
- Icons, 404.html, site.webmanifest, robots.txt → `dist/`

**Dev server**: Default Webpack Dev Server port (typically `http://localhost:8080`). Auto-opens browser on `npm start`.

## Code Conventions

Enforced via `.editorconfig` — all editors and AI assistants should follow these:

- **Indentation**: 2 spaces (no tabs)
- **Encoding**: UTF-8
- **Line endings**: LF (Unix-style, enforced across all platforms via `.gitattributes`)
- **Trailing whitespace**: Always trimmed
- **Final newline**: Required on all files

**File naming**: kebab-case for filenames (e.g., `style.css`, `app.js`, `webpack.config.dev.js`).

**JavaScript**: Standard JS conventions. Vendor/third-party libraries go in `js/vendor/` and are committed directly (not npm-managed).

## Key Entry Points

- **HTML**: `index.html` — the root page, loads `css/style.css` and `js/app.js`
- **JavaScript**: `js/app.js` — currently empty; all application logic starts here
- **Styles**: `css/style.css` — HTML5 Boilerplate base; extend this file for custom styles

## Dependencies

**No runtime dependencies.** All dependencies are `devDependencies`:

| Package | Version | Purpose |
|---------|---------|---------|
| `webpack` | ^5.94.0 | Module bundler |
| `webpack-cli` | ^5.1.4 | Webpack command-line interface |
| `webpack-dev-server` | ^5.0.4 | Local dev server with live reload |
| `webpack-merge` | ^6.0.1 | Merges webpack config objects |
| `html-webpack-plugin` | ^5.6.0 | Injects bundled script into HTML template |
| `copy-webpack-plugin` | ^11.0.0 | Copies static assets to `dist/` on build |

## Testing

No test framework is configured. `npm test` currently exits with an error. When adding tests:
- Consider **Vitest** or **Jest** for unit tests
- Add test files alongside source files or in a dedicated `tests/` directory
- Update the `"test"` script in `package.json`

## CI/CD

No GitHub Actions or CI/CD pipelines are configured. There is no `.github/workflows/` directory.

## What Does Not Exist (yet)

- No backend / server-side code
- No database
- No authentication logic
- No API client code (the README documents the Svix API but no integration exists)
- No test suite
- No linter (ESLint/Prettier not configured)
- No TypeScript

## Common Tasks for AI Assistants

**Adding JavaScript functionality**: Write code in `js/app.js`. For large features, create new modules in `js/` and import them from `app.js`.

**Adding styles**: Edit `css/style.css`. The existing file uses HTML5 Boilerplate resets; add custom rules below the existing content.

**Adding third-party libraries (without npm)**: Place the library file in `js/vendor/` and include a `<script>` tag in `index.html`, or import it in `app.js` if it supports ES modules.

**Adding third-party libraries (via npm)**: Install as a `devDependency` (if build-time only) or `dependency`. Import in `app.js`; Webpack will bundle it.

**Modifying the HTML shell**: Edit `index.html`. The production build uses it as a template for `HtmlWebpackPlugin`.

**Production build verification**: Run `npm run build`, then inspect the `dist/` directory to confirm assets are copied correctly.
