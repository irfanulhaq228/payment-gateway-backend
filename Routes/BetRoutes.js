const express = require("express");
const { createBets, getAllBets, getAllBetsByAdmin, getAllBetsByUser, getAllOpenBetsByUser } = require("../Controllers/BetController");

const BetRouter = express.Router();

BetRouter.post("/", createBets);
BetRouter.get("/", getAllBets);
BetRouter.get("/admin", getAllBetsByAdmin);
BetRouter.get("/user", getAllBetsByUser);
BetRouter.get("/user/open", getAllOpenBetsByUser);

module.exports = BetRouter;