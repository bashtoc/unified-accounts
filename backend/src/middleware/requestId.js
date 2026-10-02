"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requestId = requestId;
var _crypto = require("crypto");
function requestId(req, res, next) {
  req.requestId = req.header('x-request-id') ?? (0, _crypto.randomUUID)();
  res.setHeader('x-request-id', req.requestId);
  next();
}