const testSquidHttp = require('../services/testSquidHttp.service');

function handleSquidHttpTestRoute(req, res) {
    const result = testSquidHttp();
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: result.status }));
}

module.exports = {
	handleSquidHttpTestRoute
};