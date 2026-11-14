const fs = require("node:fs");
const path = require("node:path");

const newList = [];

function getFromPackage(name, paramter) {
  const packageContent = fs.readFileSync(
    path.join(__dirname, "..", "node_modules", name, "package.json"),
    "utf8"
  );
  const packageJson = JSON.parse(packageContent);
  return packageJson[paramter] ?? "n/a";
}

const packageFile = fs.readFileSync(
  path.join(__dirname, "..", "package-lock.json"),
  "utf8",
);

const lockfile = JSON.parse(packageFile);

if (lockfile.packages && typeof lockfile.packages === "object") {
  Object.keys(lockfile.packages)
    .filter(key => key.startsWith("node_modules/"))
    .map(key => key.replace("node_modules/", ""))
    .forEach(name => {
      const newEntry = {};
      
      newEntry[name] = {
        "version": lockfile.packages[`node_modules/${name}`].version ?? "n/a",
        "license": lockfile.packages[`node_modules/${name}`].license ?? "n/a",
        "description": getFromPackage(name, "description"),
        "homepage": getFromPackage(name, "homepage"),
        "author": getFromPackage(name, "author")
      };

      newList.push(newEntry);
    });
} else {
    console.error("No packages found in the lockfile.");
}

try {
  fs.writeFileSync(
    path.join(__dirname, "..", "modules.json"),
    JSON.stringify(newList, null, 2),
    "utf8"
  );
} catch (error) {
  console.error("Error writing modules.json:", error);
}

try {   
    fs.copyFileSync(
      path.join(__dirname, "..", "modules.json"),
      path.join(__dirname, "..", "/public/assets/etc", "modules.json")
    );
} catch (error) {
    console.error("Error copying modules.json:", error);
}

console.log("Modules extraction completed.");