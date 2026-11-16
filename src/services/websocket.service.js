"use strict";

const fs = require("node:fs");
const { StringDecoder } = require("node:string_decoder");
const { WebSocket, WebSocketServer } = require("ws");
const getConfig = require("./getConfig.service");
const { executeCommandStream } = require("./sshHandler.service");
const { listAvailableLogFiles, resolveSquidLogPath } = require("./readLogFiles.service");

const config = getConfig();

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

function startLocalTailStream(socket, filePath, fileId) {
    let buffer = "";
    let decoder = new StringDecoder("utf8");
    let offset;
    let identity;
    let stopped = false;
    let reading = false;
    let readStream;

    const emitLines = (chunk) => {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line) {
                continue;
            }

            sendJson(socket, {
                type: "log-line",
                fileId,
                line,
                timestamp: Date.now()
            });
        }
    };

    const reportError = (error) => {
        console.error("Failed to read tail stream:", error.message);
        sendJson(socket, {
            type: "error",
            message: `Tail stream error: ${error.message}`
        });
    };

    const getIdentity = (stat) => `${stat.dev}:${stat.ino}:${stat.birthtimeMs}`;

    const initialStat = fs.statSync(filePath);
    offset = initialStat.size;
    identity = getIdentity(initialStat);

    const readChanges = async () => {
        if (stopped || reading) {
            return;
        }

        reading = true;
        try {
            const stat = await fs.promises.stat(filePath);
            const nextIdentity = getIdentity(stat);
            if (nextIdentity !== identity || stat.size < offset) {
                offset = 0;
                buffer = "";
                decoder = new StringDecoder("utf8");
                identity = nextIdentity;
            }

            if (stat.size <= offset) {
                reading = false;
                return;
            }

            const start = offset;
            const end = stat.size - 1;
            readStream = fs.createReadStream(filePath, {
                start,
                end,
            });
            readStream.on("data", (chunk) => {
                emitLines(decoder.write(chunk));
            });
            readStream.on("error", (error) => {
                reading = false;
                readStream = null;
                if (!stopped) {
                    reportError(error);
                }
            });
            readStream.on("end", () => {
                reading = false;
                readStream = null;
                if (stopped) {
                    return;
                }

                offset = end + 1;
            });
        } catch (error) {
            reading = false;
            if (!stopped) {
                reportError(error);
            }
        }
    };

    const timer = setInterval(readChanges, 250);
    if (typeof timer.unref === "function") {
        timer.unref();
    }

    return () => {
        stopped = true;
        clearInterval(timer);
        if (readStream) {
            readStream.destroy();
            readStream = null;
        }
    };
}

async function startSSHTailStream(socket, filePath, fileId) {
    const escapedPath = filePath.replace(/'/g, `'\\''`);
    const stream = await executeCommandStream(`tail -n 0 -F -- '${escapedPath}'`);
    const decoder = new StringDecoder("utf8");
    let buffer = "";
    let stopped = false;

    const emitLines = (text) => {
        buffer += text;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line) {
                continue;
            }

            sendJson(socket, {
                type: "log-line",
                fileId,
                line,
                timestamp: Date.now()
            });
        }
    };

    stream.on("data", (chunk) => {
        emitLines(decoder.write(chunk));
    });

    stream.stderr.on("data", (chunk) => {
        const message = chunk.toString().trim();
        if (message) {
            sendJson(socket, { type: "error", message });
        }
    });

    stream.on("error", (error) => {
        if (!stopped) {
            sendJson(socket, {
                type: "error",
                message: `Tail stream error: ${error.message}`
            });
        }
    });

    stream.on("close", (code) => {
        if (!stopped && socket.readyState === WebSocket.OPEN) {
            sendJson(socket, {
                type: "tail-stopped",
                fileId,
                message: `Tail stream stopped with code ${code}`
            });
        }
    });

    return () => {
        stopped = true;
        stream.close();
    };
}

function startTailStream(socket, filePath, fileId) {
    if (config.useSSH) {
        return startSSHTailStream(socket, filePath, fileId);
    }

    return startLocalTailStream(socket, filePath, fileId);
}

function stopTailProcess(socket) {
    socket.tailRequestId = (socket.tailRequestId || 0) + 1;
    if (socket.tailProcess) {
        socket.tailProcess();
    }

    socket.tailProcess = null;
}

async function subscribeSocketToFile(socket, requestedFileId) {
    try {
        const availableFiles = await listAvailableLogFiles();
        const filePath = await resolveSquidLogPath(requestedFileId);
        const activeFile = availableFiles.find((file) => file.path === filePath);
        const fileId = activeFile ? activeFile.id : requestedFileId || "default";

        stopTailProcess(socket);
        const requestId = socket.tailRequestId;
        const stopStream = await startTailStream(socket, filePath, fileId);
        if (requestId !== socket.tailRequestId || socket.readyState !== WebSocket.OPEN) {
            stopStream();
            return;
        }

        socket.tailProcess = stopStream;
        socket.activeFileId = fileId;

        sendJson(socket, {
            type: "subscribed",
            fileId,
            message: `Live tailing ${activeFile ? activeFile.label : filePath}`
        });
    } catch (error) {
        sendJson(socket, {
            type: "error",
            message: error.message
        });
    }
}

function createWebSocket(server) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", (socket) => {
        console.log("WebSocket client connected");

        sendJson(socket, {
            type: "connection",
            message: "WebSocket connected"
        });

        socket.on("message", (data) => {
            let payload;

            try {
                payload = JSON.parse(data.toString());
            } catch (_error) {
                sendJson(socket, {
                    type: "error",
                    message: "Invalid WebSocket JSON payload."
                });
                return;
            }

            if (payload.type === "subscribe-log-file") {
                subscribeSocketToFile(socket, payload.fileId);
                return;
            }

            sendJson(socket, {
                type: "error",
                message: `Unsupported message type: ${payload.type}`
            });
        });

        socket.on("close", () => {
            stopTailProcess(socket);
            console.log("WebSocket client disconnected");
        });

        socket.on("error", (error) => {
            console.error("WebSocket error:", error.message);
        });

        subscribeSocketToFile(socket);
    });

    console.log("WebSocket server attached on /ws");
    return wss;
}

module.exports = { createWebSocket };