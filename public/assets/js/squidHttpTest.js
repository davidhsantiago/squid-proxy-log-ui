/**
 * Test Squid HTTP proxy by making a request to it
 */
async function testSquidHttp() {
    try {
        const response = await fetch("/api/squidhttptest");
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error testing Squid HTTP:", error);
        return 0;
    }
}

document.getElementById("squid-http-test-btn").addEventListener("click", async () => {
    const resultElement = document.getElementById("squid-http-test-result");
    resultElement.textContent = "Testing...";
    
    const result = await testSquidHttp();

    console.log("Squid HTTP test result:", result);
    resultElement.textContent = result.code === 200 ? "Squid HTTP proxy is available. (" + result.code + ")" : "An error occurred. (" + result.code + ")";
});