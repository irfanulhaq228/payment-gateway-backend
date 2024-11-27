const fs = require('fs');
const path = require('path');
const gameModel = require("../Models/GameModel.js");

const createGame = async (req, res) => {
    try {
        const { name } = req.body;
        const image = req.file;
        const existingGame = await gameModel.findOne({ name });
        if (existingGame) {
            return res.status(409).json({ message: "Game already exists" });
        }
        const game = new gameModel({
            name,
            image: image.path
        });
        await game.save();
        return res.status(200).json({ message: "Game added successfully", game });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" });
    }
};

const getAllGames = async (req, res) => {
    try {
        const games = await gameModel.find();
        if (games.length === 0) {
            return res.status(400).json({ message: "Games are Empty" });
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: games });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const getAvailableGames = async (req, res) => {
    try {
        const games = await gameModel.find({ disabled: false });
        if (games.length === 0) {
            return res.status(400).json({ message: "Games are Empty" });
        }
        return res.status(200).json({ message: "Data Sent Successfully", data: games });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const deleteGame = async (req, res) => {
    try {
        const { id } = req.params;
        const game = await gameModel.findById(id);
        if (!game) {
            return res.status(400).json({ message: "Wrong Game Id" });
        }
        const imagePath = path.join(__dirname, '..', game.image);
        await gameModel.findByIdAndDelete(id);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.log(err);
                // return res.status(500).json({ message: "Error deleting image file" });
            }
        });
        return res.status(200).json({ message: "Game Deleted Successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

const updateStatus = async (req, res) => {
    try {
        const { value } = req.body;
        const { id } = req.params;
        const game = await gameModel.findByIdAndUpdate(id, { disabled: value });
        if (!game) {
            return res.status(400).json({ message: "Game not found" });
        }
        return res.status(200).json({ message: "Game Updated" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error!" })
    }
};

module.exports = {
    createGame,
    getAllGames,
    deleteGame,
    updateStatus,
    getAvailableGames
};