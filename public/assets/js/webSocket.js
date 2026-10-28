(() => {
    const reconnectDelayMs = 3000;
    const socketUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

    let socket;
    let reconnectTimer;

    function connect() {
        socket = new WebSocket(socketUrl);

        socket.addEventListener("open", () => {
            console.log("WebSocket connected");
        });

        socket.addEventListener("message", (event) => {
            try {
                const payload = JSON.parse(event.data);
                console.log("WebSocket message:", payload);
            } catch (_error) {
                console.log("WebSocket message:", event.data);
            }
        });

        socket.addEventListener("close", () => {
            console.warn("WebSocket disconnected, retrying...");
            clearTimeout(reconnectTimer);
            reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
        });

        socket.addEventListener("error", (error) => {
            console.error("WebSocket error:", error);
        });
    }

    connect();
})();
