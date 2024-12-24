const express = require("express");
const { createTransactionSlip, getAllTransactionSlips, getMerchantTransactionSlips } = require("../Controllers/TransactionSlipController");

const TransactionSlipRoutes = express.Router();

TransactionSlipRoutes.post("/create", createTransactionSlip);
TransactionSlipRoutes.get("/getAll", getAllTransactionSlips);
TransactionSlipRoutes.get("/get", getMerchantTransactionSlips);

module.exports = TransactionSlipRoutes;