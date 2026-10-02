"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringAdminController = exports.MonitoringAdminController = void 0;
var _service = require("../services/merchantApprovalService");
var _response = require("../utils/response");

class MonitoringAdminController {
  list = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.list(req.query));
  summary = async (_req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.summary());
  detail = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.detail(req.params.applicationId));
  history = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.history(req.params.applicationId));
  approve = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.decide({ applicationId: req.params.applicationId, action: "APPROVED", reason: req.body?.reason, reviewer: req.monitoringAdmin }));
  reject = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.decide({ applicationId: req.params.applicationId, action: "REJECTED", reason: req.body.reason, reviewer: req.monitoringAdmin }));
  suspend = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.decide({ applicationId: req.params.applicationId, action: "SUSPENDED", reason: req.body.reason, reviewer: req.monitoringAdmin }));
  reactivate = async (req, res) => (0, _response.ok)(res, await _service.merchantApprovalService.decide({ applicationId: req.params.applicationId, action: "REACTIVATED", reason: req.body?.reason, reviewer: req.monitoringAdmin }));
}

exports.MonitoringAdminController = MonitoringAdminController;
const monitoringAdminController = exports.monitoringAdminController = new MonitoringAdminController();
