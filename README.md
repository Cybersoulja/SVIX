# Svix Dashboard

A lightweight client-side dashboard for managing [Svix](https://www.svix.com/) webhook applications. Built with vanilla JavaScript and Webpack 5.

## Features

- Connect using any Svix API key (US, EU, or IN region)
- Create, view, and delete applications
- Add and remove webhook endpoints per application
- Inspect recent messages per application
- API key stored locally in `localStorage` — no backend required

## Getting Started

```bash
npm install
npm start
```

The dev server opens automatically. Enter your Svix API key in the dashboard to connect.

## Building for Production

```bash
npm run build
```

Output is written to `dist/`. Serve that directory with any static file host.

## Configuration

| Setting | Where |
|---------|-------|
| API key | Entered in the dashboard UI, persisted in `localStorage` |
| Region | Selected in the dashboard UI (US / EU / IN) |

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no UI framework
- [Webpack 5](https://webpack.js.org/) for bundling and dev server
- [HTML5 Boilerplate](https://html5boilerplate.com/) as the CSS/HTML foundation

## Svix API Reference

- [Svix API Docs](https://api.svix.com/docs)
- [Svix Dashboard](https://dashboard.svix.com/)
