document.addEventListener("DOMContentLoaded", () => {
    const statusTextElement = document.getElementById("service-status");
    const statusDotElement = document.getElementById("service-status-dot");

    if (!statusTextElement || !statusDotElement) {
        return;
    }

    function renderStatus(systemdStatusCode) {
        statusDotElement.classList.remove("is-active", "is-inactive");

        if (systemdStatusCode === 0) {
            statusTextElement.textContent = "Online";
            statusDotElement.classList.add("is-active");
            return;
        }

        statusTextElement.textContent = "Offline";
        statusDotElement.classList.add("is-inactive");
    }

    function loadStatus() {
        fetch("/health")
            .then(response => response.json())
            .then(data => {
                renderStatus(data.systemdStatusCode);
            })
            .catch(() => {
                statusTextElement.textContent = "Unknown";
                statusDotElement.classList.remove("is-active");
                statusDotElement.classList.add("is-inactive");
            });
    }

    loadStatus();
    setInterval(loadStatus, 5000);
});