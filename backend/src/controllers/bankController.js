"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bankController = exports.BankController = void 0;
var _bankService = require("../services/bankService");
var _response = require("../utils/response");
class BankController {
  list = async (_req, res) => (0, _response.ok)(res, await _bankService.bankService.list());
  getStatus = async (_req, res) => (0, _response.ok)(res, await _bankService.bankService.getStatus());
  transactionStatus = async (req, res) => (0, _response.ok)(res, await _bankService.bankService.transactionStatus(req.body));
  history = async (req, res) => (0, _response.ok)(res, await _bankService.bankService.history(Number(req.params.bankId), req.query.limit));
  get = async (req, res) => (0, _response.ok)(res, await _bankService.bankService.get(Number(req.params.bankId)));
  getGeneratedLogo = async (req, res) => {
    const svg = await _bankService.bankService.getGeneratedLogo(req.params.bankCode);
    res.type('image/svg+xml').set({
      'Cache-Control': 'public, max-age=3600',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }).send(svg);
  };
}
exports.BankController = BankController;
const bankController = exports.bankController = new BankController();
