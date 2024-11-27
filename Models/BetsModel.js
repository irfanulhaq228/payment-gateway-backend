const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    afterLoss: { type: Number, required: true },
    afterWin: { type: Number, required: true },
    amount: { type: Number, required: true },
    gameName: { type: String, required: true },
    loss: { type: Number, required: true },
    odd: { type: Number, required: true },
    profit: { type: Number, required: true },
    status: { type: String, default: "pending" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true
});

const betModel = mongoose.model('Bet', betSchema);

module.exports = betModel;
