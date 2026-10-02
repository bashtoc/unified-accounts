"use strict";

require("express-async-errors");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createApp = createApp;
var _compression = _interopRequireDefault(require("compression"));
var _cors = _interopRequireDefault(require("cors"));
var _express = _interopRequireDefault(require("express"));
var _helmet = _interopRequireDefault(require("helmet"));
var _pinoHttp = _interopRequireDefault(require("pino-http"));
var _swaggerUiExpress = _interopRequireDefault(require("swagger-ui-express"));
var _env = require("./config/env");
var _logger = require("./config/logger");
var _openapi = require("./docs/openapi");
var _errorHandler = require("./middleware/errorHandler");
var _rateLimit = require("./middleware/rateLimit");
var _requestId = require("./middleware/requestId");
var _routes = require("./routes");
var _errors = require("./utils/errors");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function createApp() {
  const app = (0, _express.default)();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((0, _helmet.default)());
  app.use((0, _cors.default)({
    origin: _env.corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'ClientID', 'clientid', 'X-API-Key']
  }));
  app.use(_express.default.json({
    limit: '100kb'
  }));
  app.use(_express.default.urlencoded({
    extended: false,
    limit: '100kb'
  }));
  app.use((0, _compression.default)());
  app.use(_requestId.requestId);
  app.use((0, _pinoHttp.default)({
    logger: _logger.logger,
    genReqId: req => req.requestId
  }));
  app.use(_rateLimit.generalLimiter);
  app.use('/api/v1', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.get('/health', (_req, res) => res.status(200).json({
    success: true,
    data: {
      status: 'ok'
    },
    meta: {}
  }));
  app.use('/docs', _swaggerUiExpress.default.serve, _swaggerUiExpress.default.setup(_openapi.openApiDocument));
  app.get('/openapi.json', (_req, res) => res.json(_openapi.openApiDocument));
  app.use('/api/v1', _routes.apiRoutes);
  app.use((_req, _res, next) => next((0, _errors.notFound)('Route was not found.')));
  app.use(_errorHandler.errorHandler);
  return app;
}
