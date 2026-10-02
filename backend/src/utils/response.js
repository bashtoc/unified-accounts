"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ok = exports.noContent = exports.created = void 0;
const ok = (res, data = {}, meta = {}) => res.status(200).json({
  success: true,
  data,
  meta
});
exports.ok = ok;
const created = (res, data = {}, meta = {}) => res.status(201).json({
  success: true,
  data,
  meta
});
exports.created = created;
const noContent = res => res.status(204).send();
exports.noContent = noContent;