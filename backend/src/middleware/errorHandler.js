"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorHandler = void 0;
var _client = require("@prisma/client");
var _errors = require("../utils/errors");
var _logger = require("../config/logger");
const errorHandler = (err, req, res, _next) => {
  if (err instanceof _errors.AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields
      },
      requestId: req.requestId
    });
  }
  if (err instanceof _client.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'The resource already exists.'
      },
      requestId: req.requestId
    });
  }
  _logger.logger.error({
    err,
    requestId: req.requestId
  }, 'Unhandled request error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.'
    },
    requestId: req.requestId
  });
};
exports.errorHandler = errorHandler;