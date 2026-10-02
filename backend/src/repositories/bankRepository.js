"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BankRepository = void 0;
var _prisma = require("../config/prisma");
class BankRepository {
  list() {
    return _prisma.prisma.bank.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }
  findById(id) {
    return _prisma.prisma.bank.findFirst({
      where: {
        id,
        active: true
      }
    });
  }
  findByCode(bankCode) {
    return _prisma.prisma.bank.findFirst({
      where: {
        bankCode,
        active: true
      }
    });
  }
  update(id, data) {
    return _prisma.prisma.bank.update({
      where: {
        id
      },
      data
    });
  }
}
exports.BankRepository = BankRepository;