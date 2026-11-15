"use strict";

let isMonitoring = true;

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

	isMonitoring = true;

	while(isMonitoring) {

		await delay(1000);
	}
}

async function stopPerfomanceStats() {
	isMonitoring = false;
}

module.exports = {
	startPerfomanceStats,
	stopPerfomanceStats
};
