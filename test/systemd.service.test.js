const test = require('node:test');
const assert = require('node:assert/strict');

const originalIsDocker = process.env.IS_DOCKER;

try {
  delete require.cache[require.resolve('../src/services/systemd.service')];
  process.env.IS_DOCKER = 'true';

  const { serviceStatus } = require('../src/services/systemd.service');

  test('serviceStatus returns 0 in Docker mode without systemctl', () => {
    assert.equal(serviceStatus('squid.service'), 0);
  });
} finally {
  if (typeof originalIsDocker === 'undefined') {
    delete process.env.IS_DOCKER;
  } else {
    process.env.IS_DOCKER = originalIsDocker;
  }
}
