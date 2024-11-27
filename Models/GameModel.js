const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    image: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    disabled: { type: Boolean, default: false }
}, {
    timestamps: true
});

const gameModel = mongoose.model('Game', gameSchema);

module.exports = gameModel;
