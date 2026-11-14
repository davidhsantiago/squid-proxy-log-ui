"use strict";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const cpuStats = {
	inSeconds: [],
	inMinutes: [],
	inHours: []
};

const memoryStats = {
	inSeconds: [],
	inMinutes: [],
	inHours: []
};

const networkStats = {
	rx: {
		inSeconds: [],
		inMinutes: [],
		inHours: []
	},
	tx: {
		inSeconds: [],
		inMinutes: [],
		inHours: []
	}
};

const systemInfo = {
	cpuInfo: "",
	totalMemory: "",
	currentIP: ""
}

async function startPerfomanceStats() {
	while(true) {
		await delay(1000);
	}
}

module.exports = {
	startPerfomanceStats
};
