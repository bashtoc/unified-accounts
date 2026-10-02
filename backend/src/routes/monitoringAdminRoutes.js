"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringAdminRoutes = void 0;
var _express = require("express");
var _auth = require("../middleware/auth");
var _controller = require("../controllers/monitoringAdminController");
var _validate = require("../middleware/validate");
var _schemas = require("../validators/schemas");

const monitoringAdminRoutes = exports.monitoringAdminRoutes = (0, _express.Router)();
monitoringAdminRoutes.use('/admin/business-applications', _auth.requireMonitoringAdmin, _auth.requireMonitoringAdminPermission('merchant_applications.read'));
monitoringAdminRoutes.get('/admin/business-applications', (0, _validate.validate)(_schemas.monitoringAdminSchemas.list), _controller.monitoringAdminController.list);
monitoringAdminRoutes.get('/admin/business-applications/summary', _controller.monitoringAdminController.summary);
monitoringAdminRoutes.get('/admin/business-applications/:applicationId', (0, _validate.validate)(_schemas.monitoringAdminSchemas.detail), _controller.monitoringAdminController.detail);
monitoringAdminRoutes.post('/admin/business-applications/:applicationId/approve', _auth.requireMonitoringAdminPermission('merchant_applications.manage'), (0, _validate.validate)(_schemas.monitoringAdminSchemas.decision), _controller.monitoringAdminController.approve);
monitoringAdminRoutes.post('/admin/business-applications/:applicationId/reject', _auth.requireMonitoringAdminPermission('merchant_applications.manage'), (0, _validate.validate)(_schemas.monitoringAdminSchemas.decisionWithRequiredReason), _controller.monitoringAdminController.reject);
monitoringAdminRoutes.post('/admin/business-applications/:applicationId/suspend', _auth.requireMonitoringAdminPermission('merchant_applications.manage'), (0, _validate.validate)(_schemas.monitoringAdminSchemas.decisionWithRequiredReason), _controller.monitoringAdminController.suspend);
monitoringAdminRoutes.post('/admin/business-applications/:applicationId/reactivate', _auth.requireMonitoringAdminPermission('merchant_applications.manage'), (0, _validate.validate)(_schemas.monitoringAdminSchemas.decision), _controller.monitoringAdminController.reactivate);
monitoringAdminRoutes.get('/admin/business-applications/:applicationId/review-history', (0, _validate.validate)(_schemas.monitoringAdminSchemas.detail), _controller.monitoringAdminController.history);
