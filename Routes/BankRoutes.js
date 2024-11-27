const express = require("express");

const { createBank, getAllBanks, deleteBank, updateBank, getAllActiveBanks, getBanks, getAdminsBank, getAdminsActiveBank } = require("../Controllers/BankController");

const BankRouter = express.Router();

BankRouter.post("/", createBank);
BankRouter.get("/", getAllBanks);
BankRouter.get("/all", getBanks);
BankRouter.get("/admin", getAdminsBank);
BankRouter.get("/admin/active", getAdminsActiveBank);
BankRouter.get("/active/:id", getAllActiveBanks);

BankRouter.delete("/:id", deleteBank);
BankRouter.patch("/:id", updateBank);

module.exports = BankRouter; 