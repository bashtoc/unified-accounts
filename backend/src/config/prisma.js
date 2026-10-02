"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prisma = void 0;
var _client = require("@prisma/client");
const prisma = exports.prisma = new _client.PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});