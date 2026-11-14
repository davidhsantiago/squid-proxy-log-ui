# External sources used by squid-proxy-log-ui

This project currently relies on the following third-party dependencies and external web assets.

## 1) NPM packages

These are declared in [package.json](package.json):

- `axios` — `^1.21.0`
  - Homepage: https://axios-http.com/
  - npm: https://www.npmjs.com/package/axios
  - License: MIT

- `dotenv` — `^18.0.9`
  - Homepage: https://github.com/motdotla/dotenv
  - npm: https://www.npmjs.com/package/dotenv
  - License: BSD-2-Clause

- `ws` — `^8.22.0`
  - Homepage: https://github.com/websockets/ws
  - npm: https://www.npmjs.com/package/ws
  - License: MIT

## 2) Locally served browser assets

- `@fontsource/space-grotesk` and `@fontsource/ibm-plex-mono` provide fonts (OFL-1.1).
- `bootstrap-icons` provides icon CSS and fonts (MIT).
- `npm run assets:vendor` copies these packages into `public/assets/vendor/`.
- Installation and npm start/dev regenerate these assets automatically.
- All three HTML pages load these assets locally; no Google Fonts or CDN requests are needed.
- GitHub and package homepage links remain external navigation links.
