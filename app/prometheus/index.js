const { collectDefaultMetrics, register } = require('prom-client');

const log = require('../log');
const image = require('./image');
const trigger = require('./trigger');
const watcher = require('./watcher');
const registry = require('./registry');

/**
 * Start the Prometheus registry.
 */
function init() {
    log.info('Init Prometheus module');
    collectDefaultMetrics();
    image.init();
    registry.init();
    trigger.init();
    watcher.init();
}

/**
 * Return all metrics as string for Prometheus scrapping.
 * @returns {string}
 */
async function output() {
    return register.metrics();
}

module.exports = {
    init,
    output,
};
