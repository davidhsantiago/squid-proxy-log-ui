"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const assets = [
    ["bootstrap-icons", "font", "bootstrap-icons"],
    ["@fontsource/space-grotesk", ".", "space-grotesk"],
    ["@fontsource/ibm-plex-mono", ".", "ibm-plex-mono"]
];

for (const [packageName, subdirectory, destination] of assets) {
    const packageDirectory = path.dirname(require.resolve(`${packageName}/package.json`));
    const target = path.join(root, "public/assets/vendor", destination);
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(path.join(packageDirectory, subdirectory), target, { recursive: true });
}

console.log("Copied npm stylesheets and fonts to public/assets/vendor.");
