const test = require("node:test");
const assert = require("node:assert/strict");

const sshHandlerPath = require.resolve("../src/services/sshHandler.service");
const originalSSHHandler = require.cache[sshHandlerPath];
const originalUseSSH = process.env.USE_SSH;
const originalLog = console.log;
const commands = [];
const listing = [
	"/var/log/squid/access.log\t120\t2026-11-16T01:00:00.000000000",
	"/var/log/squid/cache.log\t80\t2026-11-16T01:00:00.000000000"
].join("\n");

process.env.USE_SSH = "true";
console.log = () => {};
require.cache[sshHandlerPath] = {
	id: sshHandlerPath,
	filename: sshHandlerPath,
	loaded: true,
	exports: {
		executeCommand: async (command) => {
			commands.push(command);
			if (command.startsWith("find ")) {
				return { stdout: listing, stderr: "", exitCode: 0 };
			}
			if (command === "cat -- '/var/log/squid/access.log'") {
				return { stdout: "older line\nnewest line\n", stderr: "", exitCode: 0 };
			}
			throw new Error(`Unexpected remote command: ${command}`);
		}
	}
};

const { handleLogsRoute } = require("../src/routes/logs");
console.log = originalLog;

test("the logs route reads and paginates SSH files remotely", async () => {
	const response = {
		writeHead(status) {
			this.status = status;
		},
		end(body) {
			this.body = body;
		}
	};

	await handleLogsRoute(
		{},
		response,
		new URL("http://localhost/api/logs?page=1&limit=1&file=ssh%2Faccess.log")
	);

	assert.equal(response.status, 200);
	const payload = JSON.parse(response.body);
	assert.deepEqual(payload.data, ["newest line"]);
	assert.equal(payload.activeFileId, "ssh/access.log");
	assert.ok(commands.includes("cat -- '/var/log/squid/access.log'"));
});

test.after(() => {
	if (originalSSHHandler) {
		require.cache[sshHandlerPath] = originalSSHHandler;
	} else {
		delete require.cache[sshHandlerPath];
	}
	if (typeof originalUseSSH === "undefined") {
		delete process.env.USE_SSH;
	} else {
		process.env.USE_SSH = originalUseSSH;
	}
	console.log = originalLog;
});
