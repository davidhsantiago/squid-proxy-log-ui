"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const getConfig = require("./getConfig.service");
const { executeCommand } = require("./sshHandler.service");

const config = getConfig();

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

function quoteShellArgument(value) {
	return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function readLogFileContent(filePath) {
	if (config.useSSH) {
		const result = await executeCommand(`cat -- ${quoteShellArgument(filePath)}`);
		if (result.exitCode !== 0) {
			const details = result.stderr.trim() || `remote command exited with code ${result.exitCode}`;
			throw new Error(`Failed to read log file over SSH: ${details}`);
		}

		return result.stdout;
	}

	if (!fs.existsSync(filePath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	return fs.readFileSync(filePath, "utf-8");
}

/**
 * List all available Squid log files.
 * @returns {Promise<Array>} A promise that resolves to log file objects with id, label, path, size, and modifiedAt.
 */
async function listAvailableLogFiles() {
	const directories = [...listConfiguredDirectories(), ...DEFAULT_LOG_DIRECTORIES];
	const uniquePaths = new Set();
	const files = [];

	if (config.useSSH) {
		return listAvailableLogFilesSSH();
	}

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

	const configuredFile = config.squidLogFile;
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
 * List all available Squid log files over SSH.
 * @returns {Promise<Array>} A promise that resolves to an array of log file objects with id, label, path, size, and modifiedAt.
 */
async function listAvailableLogFilesSSH() {
	const result = await executeCommand(
		`find ${DEFAULT_LOG_DIRECTORIES.join(" ")} -maxdepth 1 -type f -name '*.log' -printf '%p\\t%s\\t%TY-%Tm-%TdT%TH:%TM:%TS\\n' 2>/dev/null`
	);
	const lines = result.stdout.split(/\r?\n/).filter((line) => line.length > 0);

	return lines
		.map((line) => {
			const [filePath, sizeText, modifiedAt] = line.split("\t");
			if (!filePath || !sizeText || !modifiedAt) {
				return null;
			}

			const size = Number.parseInt(sizeText, 10);
			const fileName = path.basename(filePath);

			return {
				id: `ssh/${fileName}`,
				label: `ssh/${fileName}`,
				path: filePath,
				size,
				modifiedAt
			};
		})
		.filter(Boolean);
}

/**
 * Resolve the full path of a Squid log file by its ID.
 * @param {string} logFileId - The ID of the log file.
 * @returns {Promise<string>} A promise that resolves to the full path to the log file.
 * @throws {Error} If the log file cannot be found.
 */
async function resolveSquidLogPath(logFileId) {
	const availableFiles = await listAvailableLogFiles();

	if (logFileId) {
		const selected = availableFiles.find((file) => file.id === logFileId);
		if (!selected) {
			throw new Error(`Log file '${logFileId}' not found in available list.`);
		}

		return selected.path;
	}

	const configured = config.squidLogFile;
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
async function readLogPage(filePath, page = 1, limit = 100) {
	const content = await readLogFileContent(filePath);
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
 * Read a specific page of a log file.
 * @param {string} filePath - The path to the log file.
 * @returns {object} An object containing the log lines and file info.
 */
async function getLogFile(filePath) {
	const content = await readLogFileContent(filePath);
	const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
	const name = path.basename(filePath);

	return {
		name,
		data: lines
	};
}

/**
 * Tail the last few lines of a log file.
 * @param {string} filePath - The path to the log file.
 * @param {number} lines - The number of lines to tail.
 * @returns {string} The tailed log lines.
 */
function tailLogFile(filePath, lines = 10) {
	const safeLines = Number.isInteger(lines) && lines > 0 ? lines : 10;
	const safePath = String(filePath || "").trim();

	if (!safePath) {
		throw new Error("Log file path is required.");
	}

	if (config.useSSH) {
		return executeCommand(`tail -n ${safeLines} ${quoteShellArgument(safePath)}`)
			.then((result) => result.stdout)
			.catch((error) => {
				throw new Error(`Failed to tail log file over SSH: ${error.message}`);
			});
	}

	if (!fs.existsSync(safePath)) {
		throw new Error(`File not found: ${safePath}`);
	}

	try {
		return execFileSync("tail", ["-n", String(safeLines), safePath], { encoding: "utf-8" });
	} catch (error) {
		const content = fs.readFileSync(safePath, "utf-8");
		const sliced = content
			.split(/\r?\n/)
			.filter((line) => line.length > 0)
			.slice(-safeLines);
		return sliced.join("\n");
	}
}

module.exports = {
	readLogFile,
	readLogPage,
	listAvailableLogFiles,
	resolveSquidLogPath,
	tailLogFile,
	getLogFile
};
