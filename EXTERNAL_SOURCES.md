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

## 2) External assets loaded in the HTML pages

These are referenced directly in the browser from the public HTML files:

### Google Fonts

- Source: https://fonts.googleapis.com
- Source: https://fonts.gstatic.com
- CSS URL: https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap
- Fonts used:
  - Space Grotesk
  - IBM Plex Mono

### Bootstrap Icons

- CSS URL: https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css
- Project: https://icons.getbootstrap.com/
- License: MIT

### GitHub project links

- GitHub repository: https://github.com/davidh/squid-proxy-log-ui
- This is not a library dependency, but it is an external link used in the UI.

## 3) Notes

- The project does not currently include Bootstrap CSS or Bootstrap JS directly.
- The repository uses Bootstrap Icons, not the full Bootstrap framework.
- The app also references local project files for styling and behavior, but the third-party sources above are the external ones currently in use.
