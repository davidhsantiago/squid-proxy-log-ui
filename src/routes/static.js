"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_DIR = path.resolve(__dirname, "../../public");

const CONTENT_TYPES = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8"
};

/**
 * Returns the content type based on the file extension.
 * @param {string} filePath
 * @returns {string} The content type.
 */
function getContentType(filePath) {
	const extension = path.extname(filePath).toLowerCase();
	return CONTENT_TYPES[extension] || "application/octet-stream";
}

/**
 * Resolves the absolute path of a public file if it exists.
 * @param {string} pathname
 * @returns {string|null} The absolute path if the file exists, null otherwise.
 */
function resolvePublicFile(pathname) {
	const decodedPath = decodeURIComponent(pathname || "/");
	const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
	const normalized = path.posix.normalize(requestedPath).replace(/^\/+/, "");
	const absolutePath = path.join(PUBLIC_DIR, normalized);

	if (!absolutePath.startsWith(PUBLIC_DIR)) {
		return null;
	}

	try {
		const stat = fs.statSync(absolutePath);
		if (stat.isFile()) {
			return absolutePath;
		}

		if (stat.isDirectory()) {
			const indexPath = path.join(absolutePath, "index.html");
			if (fs.existsSync(indexPath)) {
				return indexPath;
			}
		}
	} catch (_error) {
		return null;
	}

	return null;
}

/**
 * Serves a public file if it exists.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {URL} url
 * @returns {boolean} True if the file was served, false otherwise.
 */
function servePublicFile(req, res, url) {
	if ((req.method || "GET") !== "GET") {
		return false;
	}

	const filePath = resolvePublicFile(url.pathname);
	if (!filePath) {
		return false;
	}

	res.writeHead(200, { "Content-Type": getContentType(filePath) });
	fs.createReadStream(filePath).pipe(res);
	return true;
}

module.exports = {
	servePublicFile
};
