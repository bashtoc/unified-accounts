"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unauthorized = exports.notFound = exports.forbidden = exports.conflict = exports.businessRule = exports.badRequest = exports.AppError = void 0;
class AppError extends Error {
  constructor(statusCode, code, message, fields) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}
exports.AppError = AppError;
const badRequest = (message = 'The submitted data is invalid.', fields) => new AppError(400, 'VALIDATION_ERROR', message, fields);
exports.badRequest = badRequest;
const unauthorized = (message = 'Authentication is required.') => new AppError(401, 'UNAUTHORIZED', message);
exports.unauthorized = unauthorized;
const forbidden = (message = 'You do not have permission to perform this action.') => new AppError(403, 'FORBIDDEN', message);
exports.forbidden = forbidden;
const notFound = (message = 'The requested resource was not found.') => new AppError(404, 'NOT_FOUND', message);
exports.notFound = notFound;
const conflict = (message = 'The resource already exists.') => new AppError(409, 'CONFLICT', message);
exports.conflict = conflict;
const businessRule = message => new AppError(422, 'BUSINESS_RULE_VIOLATION', message);
exports.businessRule = businessRule;