"use strict";

const {
	listAvailableLogFiles,
	readLogPage,
	resolveSquidLogPath,
	getLogFile
} = require("../services/readLogFiles.service");

/**
 * Converts a value to a positive integer, or returns a fallback if invalid.
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function toPositiveInt(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return fallback;
	}
	return parsed;
}

/**
 * Handles the /api/logs route.
 * @param {http.IncomingMessage} _req
 * @param {http.ServerResponse} res
 * @param {URL} url
 */
function handleLogsRoute(_req, res, url) {
	const limit = toPositiveInt(url.searchParams.get("limit"), 100);
	const page = toPositiveInt(url.searchParams.get("page"), 1);
	const logFileId = url.searchParams.get("file") || undefined;

	try {
		const logPath = resolveSquidLogPath(logFileId);
		const result = readLogPage(logPath, page, limit);
		const availableFiles = listAvailableLogFiles();
		const activeFile = availableFiles.find((file) => file.path === logPath);

		const body = JSON.stringify({
			data: result.data,
			pagination: result.pagination,
			activeFileId: activeFile ? activeFile.id : null,
			message: `Reading ${logPath}`
		});

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(body);
	} catch (error) {
		const body = JSON.stringify({
			data: [],
			pagination: {
				page,
				limit,
				total: 0,
				totalPages: 1,
				hasPrev: false,
				hasNext: false
			},
			message: error.message
		});

		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(body);
	}
}

/**
 * Handles the /api/log-files route.
 * @param {http.IncomingMessage} _req
 * @param {http.ServerResponse} res
 */
function handleLogFilesRoute(_req, res) {
	try {
		const availableFiles = listAvailableLogFiles();
		const activePath = resolveSquidLogPath();
		const activeFile = availableFiles.find((file) => file.path === activePath);

		const body = JSON.stringify({
			data: availableFiles.map((file) => ({
				id: file.id,
				label: file.label,
				size: file.size,
				modifiedAt: file.modifiedAt
			})),
			activeFileId: activeFile ? activeFile.id : null
		});

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(body);
	} catch (error) {
		const body = JSON.stringify({
			data: [],
			activeFileId: null,
			message: error.message
		});

		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(body);
	}
}

/**
 * Handles the /api/log-file route.
 * @param {http.IncomingMessage} _req
 * @param {http.ServerResponse} res
 * @param {URL} url
 */
function handleLogFileDownload(_req, res, url) {
	try {
		const logFileId = url.searchParams.get("file") || undefined;
		const logPath = resolveSquidLogPath(logFileId);
		const file = getLogFile(logPath);
		const body = JSON.stringify({
			file: file
		});

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(body);

	} catch (error) {
		const body = JSON.stringify({
			message: error.message
		});

		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(body);
	}
}

module.exports = {
	handleLogFilesRoute,
	handleLogsRoute,
	handleLogFileDownload
};
