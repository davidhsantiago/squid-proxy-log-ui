document.addEventListener("DOMContentLoaded", () => {
    const logsTableBody = document.getElementById("logs-table-body");
    const viewerStatus = document.getElementById("viewer-status");
    const viewerPagination = document.getElementById("viewer-pagination");
    const prevPageButton = document.getElementById("prev-page");
    const nextPageButton = document.getElementById("next-page");
    const refreshButton = document.getElementById("refresh-button");
    const downloadButton = document.getElementById("download-button");
    const limitSelect = document.getElementById("limit-select");
    const logFileSelect = document.getElementById("log-file-select");

    if (
        !logsTableBody ||
        !viewerStatus ||
        !viewerPagination ||
        !prevPageButton ||
        !nextPageButton ||
        !refreshButton ||
        !limitSelect ||
        !logFileSelect
    ) {
        return;
    }

    let page = 1;
    let limit = Number.parseInt(limitSelect.value, 10) || 50;
    let selectedFileId = "";
    let historyEntries = [];
    let liveEntries = [];
    let queuedLiveCount = 0;
    let paginationState = {
        hasNext: true,
        hasPrev: false,
        total: 0,
        totalPages: 1
    };

    const socketUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;
    let liveSocket;
    let reconnectTimer;

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#039;");
    }

    function renderRows() {
        const combinedEntries = page === 1
            ? [...liveEntries, ...historyEntries]
            : historyEntries;

        const visibleEntries = combinedEntries.slice(0, limit);

        if (visibleEntries.length === 0) {
            logsTableBody.innerHTML = "<tr><td colspan=\"3\">No log entries available.</td></tr>";
            return;
        }

        const rows = visibleEntries
            .map((entry, index) => {
                const rowIndex = (page - 1) * limit + index + 1;
                const source = entry.source === "live" ? "Live" : "History";
                const text = typeof entry.text === "string" ? entry.text : JSON.stringify(entry.text);
                return `<tr><td>${rowIndex}</td><td>${source}</td><td class=\"viewer-cell-log\">${escapeHtml(text)}</td></tr>`;
            })
            .join("");

        logsTableBody.innerHTML = rows;
    }

    function prependLiveLine(line) {
        liveEntries.unshift({ source: "live", text: line });

        if (liveEntries.length > 500) {
            liveEntries = liveEntries.slice(0, 500);
        }

        if (page === 1) {
            renderRows();
            return;
        }

        queuedLiveCount += 1;
        viewerStatus.textContent = `Page ${page} locked to history. ${queuedLiveCount} live updates queued.`;
    }

    function connectLiveSocket() {
        liveSocket = new WebSocket(socketUrl);

        liveSocket.addEventListener("open", () => {
            viewerStatus.textContent = "Live stream connected.";
            if (selectedFileId) {
                liveSocket.send(JSON.stringify({
                    type: "subscribe-log-file",
                    fileId: selectedFileId
                }));
            }
        });

        liveSocket.addEventListener("message", (event) => {
            try {
                const payload = JSON.parse(event.data);

                if (payload.type === "log-line" && typeof payload.line === "string") {
                    prependLiveLine(payload.line);
                }

                if (payload.type === "subscribed") {
                    queuedLiveCount = 0;
                    liveEntries = [];
                    viewerStatus.textContent = payload.message || "Live stream subscribed.";
                }

                if (payload.type === "tail-stopped") {
                    viewerStatus.textContent = payload.message || "Tail stream stopped.";
                }

                if (payload.type === "error") {
                    viewerStatus.textContent = payload.message || "Live stream error.";
                }
            } catch (_error) {
                // Ignore non-JSON frames.
            }
        });

        liveSocket.addEventListener("close", () => {
            viewerStatus.textContent = "Live stream disconnected. Reconnecting...";
            clearTimeout(reconnectTimer);
            reconnectTimer = window.setTimeout(connectLiveSocket, 3000);
        });

        liveSocket.addEventListener("error", () => {
            viewerStatus.textContent = "Live stream unavailable.";
        });
    }

    function updatePager() {
        const extra = page === 1 && liveEntries.length > 0
            ? ` + ${liveEntries.length} live`
            : "";

        viewerPagination.textContent = `Page ${page} / ${paginationState.totalPages}${extra}`;
        prevPageButton.disabled = !paginationState.hasPrev;
        nextPageButton.disabled = !paginationState.hasNext;
    }

    async function downloadCurrentFile(lines) {
        console.log(lines);

        const query = new URLSearchParams({
            file: String(selectedFileId)
        });

        const response = await fetch(`/api/log-file?${query.toString()}`);
        const file = (await response.json()).file;

        const link = document.createElement("a");

        let content;

        if (lines != null) {
            if (lines > 0) {
                content = trimLogs({quantity: lines, content: file.data});
            } else {
                content = trimLogs({content: file.data});
            }
        } else {
            content = trimLogs({content: file.data});
        }

        const f = new Blob([content], { type: "text/plain" });

        link.href = URL.createObjectURL(f);
        link.download = file.name;

        link.click();

        URL.revokeObjectURL(link.href);
    }

    function trimLogs({quantity, content}) {

        if (quantity) {
            if (quantity < content.length)
                content.splice(0, content.length - quantity);
        }

        return content.join("\n");
    }

    async function loadLogs() {
        viewerStatus.textContent = "Loading logs...";

        try {
            const query = new URLSearchParams({
                page: String(page),
                limit: String(limit)
            });

            if (selectedFileId) {
                query.set("file", selectedFileId);
            }

            const response = await fetch(`/api/logs?${query.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            historyEntries = Array.isArray(payload.data)
                ? payload.data.map((line) => ({ source: "history", text: line }))
                : [];

            paginationState = payload.pagination || paginationState;

            if (payload.message) {
                viewerStatus.textContent = payload.message;
            } else {
                viewerStatus.textContent = "Logs loaded.";
            }

            if (payload.pagination && Number.isInteger(payload.pagination.page)) {
                page = payload.pagination.page;
            }

            if (page === 1) {
                queuedLiveCount = 0;
            }

            renderRows();
            updatePager();
        } catch (error) {
            viewerStatus.textContent = "Failed to load logs.";
            logsTableBody.innerHTML = `<tr><td colspan=\"3\">${error.message}</td></tr>`;
        }
    }

    async function loadLogFiles() {
        try {
            const response = await fetch("/api/log-files");
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = await response.json();
            const files = Array.isArray(payload.data) ? payload.data : [];

            logFileSelect.innerHTML = "";

            if (files.length === 0) {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "No log files found";
                logFileSelect.appendChild(option);
                selectedFileId = "";
                return;
            }

            for (const file of files) {
                const option = document.createElement("option");
                option.value = file.id;
                option.textContent = file.label;
                logFileSelect.appendChild(option);
            }

            selectedFileId = payload.activeFileId || files[0].id;
            logFileSelect.value = selectedFileId;
        } catch (error) {
            logFileSelect.innerHTML = "";
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Unable to load files";
            logFileSelect.appendChild(option);
            selectedFileId = "";
            viewerStatus.textContent = `Failed to load log files: ${error.message}`;
        }
    }

    prevPageButton.addEventListener("click", () => {
        if (page > 1) {
            page -= 1;
            loadLogs();
        }
    });

    nextPageButton.addEventListener("click", () => {
        page += 1;
        loadLogs();
    });

    refreshButton.addEventListener("click", () => {
        loadLogs();
    });

    downloadButton.addEventListener("click", () => {

        const lines = window.prompt("Please select the number of logs to save.\n(Blank for the whole file)", "all").trim();

        if (lines == "all" || isNaN(lines))
            downloadCurrentFile();
        else {
            if (lines > 0)
                downloadCurrentFile(lines);
            else
                downloadCurrentFile();
        }
    });

    limitSelect.addEventListener("change", () => {
        limit = Number.parseInt(limitSelect.value, 10) || 50;
        page = 1;
        loadLogs();
    });

    logFileSelect.addEventListener("change", () => {
        selectedFileId = logFileSelect.value;
        page = 1;
        queuedLiveCount = 0;
        liveEntries = [];
        loadLogs();

        if (liveSocket && liveSocket.readyState === WebSocket.OPEN && selectedFileId) {
            liveSocket.send(JSON.stringify({
                type: "subscribe-log-file",
                fileId: selectedFileId
            }));
        }
    });

    updatePager();
    loadLogFiles()
        .then(() => {
            loadLogs();
            connectLiveSocket();
        });
});
