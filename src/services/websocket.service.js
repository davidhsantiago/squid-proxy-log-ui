"use strict";

const { spawn } = require("node:child_process");
const { WebSocket, WebSocketServer } = require("ws");
const { listAvailableLogFiles, resolveSquidLogPath } = require("./readLogFiles.service");

function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) {
        return;
    }

    socket.send(JSON.stringify(payload));
}

function startTailStream(socket, filePath, fileId) {
    const tail = spawn("tail", ["-n", "0", "-F", filePath], {
        stdio: ["ignore", "pipe", "pipe"]
    });

    let buffer = "";

    tail.stdout.on("data", (chunk) => {
        buffer += chunk.toString();
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
    });

    tail.stderr.on("data", (chunk) => {
        const message = chunk.toString().trim();
        if (!message) {
            return;
        }

        console.error("tail stderr:", message);
        sendJson(socket, {
            type: "error",
            message
        });
    });

    tail.on("error", (error) => {
        console.error("Failed to start tail stream:", error.message);
        sendJson(socket, {
            type: "error",
            message: `Tail stream error: ${error.message}`
        });
    });

    tail.on("close", (code) => {
        if (socket.readyState !== socket.OPEN) {
            return;
        }

        sendJson(socket, {
            type: "tail-stopped",
            fileId,
            message: `Tail stream stopped with code ${code}`
        });
    });

    return tail;
}

function stopTailProcess(socket) {
    if (socket.tailProcess && !socket.tailProcess.killed) {
        socket.tailProcess.kill("SIGTERM");
    }

    socket.tailProcess = null;
}

function subscribeSocketToFile(socket, requestedFileId) {
    try {
        const availableFiles = listAvailableLogFiles();
        const filePath = resolveSquidLogPath(requestedFileId);
        const activeFile = availableFiles.find((file) => file.path === filePath);
        const fileId = activeFile ? activeFile.id : requestedFileId || "default";

        stopTailProcess(socket);
        socket.tailProcess = startTailStream(socket, filePath, fileId);
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