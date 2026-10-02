"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = void 0;
var _errors = require("../utils/errors");
const validate = schema => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;
    next();
  } catch (error) {
    const zodError = error;
    const fields = zodError.issues.reduce((acc, issue) => {
      const path = issue.path.join('.');
      acc[path] = acc[path] ?? [];
      acc[path].push(issue.message);
      return acc;
    }, {});
    next((0, _errors.badRequest)('The submitted data is invalid.', fields));
  }
};
exports.validate = validate;