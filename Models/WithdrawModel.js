const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bank: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    amount: { type: Number },
    status: { type: String },
}, {
    timestamps: true
});

const depositModel = mongoose.model('Withdraw', depositSchema);

module.exports = depositModel;