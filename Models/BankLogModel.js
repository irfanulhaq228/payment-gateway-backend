const mongoose = require('mongoose');

const bankLogSchema = new mongoose.Schema({
    reason: { type: String, required: false},
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    status: { type: String, required: false},
}, {
    timestamps: true
});

const bankLogModel = mongoose.model('BankLog', bankLogSchema);

module.exports = bankLogModel;
