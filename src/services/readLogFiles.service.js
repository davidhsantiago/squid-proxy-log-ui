"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const DEFAULT_LOG_CANDIDATES = [
	"/var/log/squid/access.log",
	"/var/log/squid3/access.log"
];

const DEFAULT_LOG_DIRECTORIES = [
	"/var/log/squid",
	"/var/log/squid3"
];

/**
 * List all configured Squid log directories from the environment variable.
 * @returns {Array} An array of configured directories.
 */
function listConfiguredDirectories() {
	const configured = process.env.SQUID_LOG_DIRS;
	if (!configured) {
		return [];
	}

	return configured
		.split(":")
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}
/**
 * Build a unique ID for a log file based on its directory and filename.
 * @param {string} directory - The directory containing the log file.
 * @param {string} filename - The name of the log file.
 * @returns {string} The unique ID for the log file.
 */
function buildLogFileId(directory, filename) {
	return `${path.basename(directory)}/${filename}`;
}

/**
 * List all available Squid log files.
 * @returns {Array} An array of log file objects with id, label, path, size, and modifiedAt.
 */
function listAvailableLogFiles() {
	const directories = [...listConfiguredDirectories(), ...DEFAULT_LOG_DIRECTORIES];
	const uniquePaths = new Set();
	const files = [];

	for (const directory of directories) {
		if (!fs.existsSync(directory)) {
			continue;
		}

		const entries = fs.readdirSync(directory, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isFile()) {
				continue;
			}

			if (!/\.log(?:\.\d+)?$/i.test(entry.name)) {
				continue;
			}

			const absolutePath = path.join(directory, entry.name);
			if (uniquePaths.has(absolutePath)) {
				continue;
			}

			const stat = fs.statSync(absolutePath);
			files.push({
				id: buildLogFileId(directory, entry.name),
				label: `${path.basename(directory)}/${entry.name}`,
				path: absolutePath,
				size: stat.size,
				modifiedAt: stat.mtime.toISOString()
			});
			uniquePaths.add(absolutePath);
		}
	}

	const configuredFile = process.env.SQUID_LOG_FILE;
	if (configuredFile && fs.existsSync(configuredFile) && !uniquePaths.has(configuredFile)) {
		const stat = fs.statSync(configuredFile);
		files.push({
			id: `configured/${path.basename(configuredFile)}`,
			label: `configured/${path.basename(configuredFile)}`,
			path: configuredFile,
			size: stat.size,
			modifiedAt: stat.mtime.toISOString()
		});
	}

	files.sort((a, b) => a.label.localeCompare(b.label));
	return files;
}

/**
 * Resolve the full path of a Squid log file by its ID.
 * @param {string} logFileId - The ID of the log file.
 * @returns {string} The full path to the log file.
 * @throws {Error} If the log file cannot be found.
 */
function resolveSquidLogPath(logFileId) {
	const availableFiles = listAvailableLogFiles();

	if (logFileId) {
		const selected = availableFiles.find((file) => file.id === logFileId);
		if (!selected) {
			throw new Error(`Log file '${logFileId}' not found in available list.`);
		}

		return selected.path;
	}

	const configured = process.env.SQUID_LOG_FILE;
	if (configured && fs.existsSync(configured)) {
		return configured;
	}

	const accessLog = availableFiles.find((file) => path.basename(file.path) === "access.log");
	if (accessLog) {
		return accessLog.path;
	}

	if (availableFiles.length > 0) {
		return availableFiles[0].path;
	}

	const candidates = configured
		? [configured, ...DEFAULT_LOG_CANDIDATES]
		: DEFAULT_LOG_CANDIDATES;

	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	throw new Error(
		`No Squid log file found. Set SQUID_LOG_FILE, tried: ${candidates.join(", ")}`
	);
}

/**
 * Read a log file by its directory and filename.
 * @param {string} directory - The directory containing the log file.
 * @param {string} filename - The name of the log file.
 * @returns {string} The full path to the log file.
 */
function readLogFile(directory, filename) {
	const filePath = path.join(directory, filename);
	if (!fs.existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}
	return filePath;
}

/**
 * Read a specific page of a log file.
 * @param {string} filePath - The path to the log file.
 * @param {number} page - The page number to read.
 * @param {number} limit - The number of lines per page.
 * @returns {object} An object containing the log lines and pagination info.
 */
function readLogPage(filePath, page = 1, limit = 100) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const content = fs.readFileSync(filePath, "utf-8");
	const allLines = content.split(/\r?\n/).filter((line) => line.length > 0).reverse();
	const total = allLines.length;

	const safeLimit = Math.max(1, limit);
	const totalPages = Math.max(1, Math.ceil(total / safeLimit));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const start = (safePage - 1) * safeLimit;
	const end = start + safeLimit;

	return {
		data: allLines.slice(start, end),
		pagination: {
			page: safePage,
			limit: safeLimit,
			total,
			totalPages,
			hasPrev: safePage > 1,
			hasNext: safePage < totalPages
		}
	};
}

/**
 * Tail the last few lines of a log file.
 * @param {string} filePath - The path to the log file.
 * @param {number} lines - The number of lines to tail.
 * @returns {string} The tailed log lines.
 */
function tailLogFile(filePath, lines = 10) {
	return execFileSync("tail", ["-n", String(lines), filePath], { encoding: "utf-8" });
}

module.exports = {
	readLogFile,
	readLogPage,
	listAvailableLogFiles,
	resolveSquidLogPath,
	tailLogFile
};