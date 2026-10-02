"use strict";

var _env = require("./config/env");
var _logger = require("./config/logger");
var _prisma = require("./config/prisma");
var _app = require("./app");
const app = (0, _app.createApp)();
const server = app.listen(_env.env.PORT, () => {
  _logger.logger.info({
    port: _env.env.PORT
  }, 'Safer Signal monitoring API listening');
});
async function shutdown(signal) {
  _logger.logger.info({
    signal
  }, 'Shutting down');
  server.close(async () => {
    await _prisma.prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
