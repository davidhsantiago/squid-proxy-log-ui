
const { Client } = require('ssh2');
const getConfig = require('./getConfig.service');
const ssh = new Client();

let connected = false;

/**
 * Connect to the SSH server
 * @returns {Promise<void>}
 */
function connectSSH() {
    return new Promise((resolve, reject) => {
        if (connected) {
            resolve();
            return;
        }

        ssh.once('ready', () => {
            connected = true;
            console.log('SSH connected');
            resolve();
        });

        ssh.once('error', reject);


        if (!getConfig().useSSH) {
            reject(new Error('SSH is not enabled in the configuration'));
            return;
        }

        if (getConfig().sshPassword) {
            ssh.connect({
                host: getConfig().sshHost,
                port: getConfig().sshPort,
                username: getConfig().sshUser,
                password: getConfig().sshPassword,
                keepaliveInterval: 10000,
                keepaliveCountMax: 3
            });
        } else {
            ssh.connect({
                host: getConfig().sshHost,
                port: getConfig().sshPort,
                username: getConfig().sshUser,
                privateKey: require('node:fs').readFileSync(getConfig().sshPrivateKeyPath),
                keepaliveInterval: 10000,
                keepaliveCountMax: 3
            });
        }
    });
}

/**
 * Execute a command on the SSH server
 * @param {string} command - The command to execute
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        if (!connected) {
            reject(new Error('SSH is not connected'));
            return;
        }

        ssh.exec(command, (err, stream) => {
            if (err) return reject(err);

            let stdout = '';
            let stderr = '';

            stream.on('data', data => {
                stdout += data.toString();
            });

            stream.stderr.on('data', data => {
                stderr += data.toString();
            });

            stream.on('close', (code) => {
                resolve({
                    stdout,
                    stderr,
                    exitCode: code
                });
            });

            stream.on('error', reject);
        });
    });
}

/**
 * Start a command on the SSH server and return its stream.
 * @param {string} command - The command to execute
 * @returns {Promise<import('ssh2').ClientChannel>}
 */
function executeCommandStream(command) {
    return new Promise((resolve, reject) => {
        if (!connected) {
            reject(new Error('SSH is not connected'));
            return;
        }

        ssh.exec(command, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(stream);
        });
    });
}

/**
 * Disconnect from the SSH server
 * @returns {void}
 */
function disconnectSSH() {
    ssh.end();
    connected = false;
}

ssh.on('close', () => {
    connected = false;
});

module.exports = {
    connectSSH,
    executeCommand,
    executeCommandStream,
    disconnectSSH
};
