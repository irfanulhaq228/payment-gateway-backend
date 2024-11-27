const express = require("express");
const { upload } = require("../Multer/Multer");

const { createGame, getAllGames, deleteGame, updateStatus, getAvailableGames } = require("../Controllers/GameController");

const GameRouter = express.Router();

GameRouter.post("/", upload.single('image'), createGame);
GameRouter.get("/", getAllGames);
GameRouter.get("/available", getAvailableGames);

GameRouter.delete("/:id", deleteGame);
GameRouter.post("/status/:id", updateStatus);

module.exports = GameRouter;